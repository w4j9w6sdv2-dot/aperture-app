import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { recalcPulseScore } from "@/lib/pulse"

const exifSchema = z
  .object({
    camera: z.string().optional().nullable(),
    lens: z.string().optional().nullable(),
    focalLength: z.string().optional().nullable(),
    aperture: z.string().optional().nullable(),
    shutterSpeed: z.string().optional().nullable(),
    iso: z.string().optional().nullable(),
    takenAt: z.string().optional().nullable(),
  })
  .optional()
  .nullable()

const createPhotoSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().min(1, "Image is required"),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  license: z
    .enum(["cc0", "cc-by", "cc-by-nc", "all-rights"])
    .optional()
    .default("all-rights"),
  watermarked: z.boolean().optional().default(false),
  isAdult: z.boolean().optional().default(false),
  exif: exifSchema,
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get("sort") ?? "newest"
    const authorId = searchParams.get("authorId")
    const tag = searchParams.get("tag")
    const search = searchParams.get("search")
    const categoryId = searchParams.get("categoryId")
    const followedOnly = searchParams.get("followedOnly") === "true"
    const editorPickOnly = searchParams.get("editorPickOnly") === "true"
    const cursor = searchParams.get("cursor") ?? undefined
    const take = Math.min(parseInt(searchParams.get("take") ?? "12", 10), 50)

    const currentUser = await getCurrentUser()

    let followedIds: string[] = []
    if (followedOnly && currentUser) {
      const follows = await db.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      })
      followedIds = follows.map((f) => f.followingId)
      if (followedIds.length === 0) {
        return NextResponse.json({ items: [], nextCursor: null })
      }
    }

    const where: Record<string, unknown> = {}
    if (authorId) where.authorId = authorId
    if (followedIds.length > 0) where.authorId = { in: followedIds }
    if (categoryId) where.categoryId = categoryId
    if (editorPickOnly) where.isEditorPick = true

    // NSFW filter: hide adult content unless the current user explicitly opted in
    const showAdult = currentUser?.showAdultContent === true
    if (!showAdult) {
      where.isAdult = false
    }
    if (tag) {
      // SQLite is case-insensitive for ASCII by default.
      where.tags = {
        some: { tag: { name: { equals: tag } } },
      }
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { some: { tag: { name: { contains: search } } } } },
        { author: { username: { contains: search } } },
      ]
    }

    let orderBy: Record<string, unknown>
    if (sort === "popular") {
      orderBy = { likes: { _count: "desc" as const } }
    } else if (sort === "pulse") {
      orderBy = { pulseScore: "desc" as const }
    } else if (sort === "trending") {
      // Trending: high pulse score in last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      where.createdAt = { gte: sevenDaysAgo }
      orderBy = { pulseScore: "desc" as const }
    } else {
      orderBy = { createdAt: "desc" as const }
    }

    const photos = await db.photo.findMany({
      where,
      orderBy,
      take: take + 1,
      ...(cursor
        ? { skip: 1, cursor: { id: cursor } }
        : {}),
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        tags: { include: { tag: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
        _count: {
          select: { likes: true, comments: true, views: true, savedIn: true },
        },
        ...(currentUser
          ? {
              likes: {
                where: { userId: currentUser.id },
                select: { id: true },
              },
              savedIn: {
                where: { collection: { ownerId: currentUser.id } },
                select: { id: true, collectionId: true },
              },
            }
          : {}),
      },
    })

    const hasNext = photos.length > take
    const items = hasNext ? photos.slice(0, take) : photos
    const nextCursor = hasNext ? items[items.length - 1].id : null

    return NextResponse.json({
      items: items.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
        author: p.author,
        tags: p.tags.map((t) => t.tag.name),
        category: p.category,
        location: p.location,
        license: p.license,
        watermarked: p.watermarked,
        isAdult: p.isAdult,
        isEditorPick: p.isEditorPick,
        pulseScore: p.pulseScore,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        viewCount: p._count.views,
        saveCount: p._count.savedIn,
        likedByMe: currentUser ? p.likes?.length > 0 : false,
        savedByMe: currentUser ? (p.savedIn?.length ?? 0) > 0 : false,
      })),
      nextCursor,
    })
  } catch (err) {
    console.error("[photos] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to upload" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = createPhotoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const {
      title,
      description,
      imageUrl,
      tags = [],
      categoryId,
      location,
      license,
      watermarked,
      isAdult,
      exif,
    } = parsed.data

    // Validate category if provided
    if (categoryId) {
      const cat = await db.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      })
      if (!cat) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 400 }
        )
      }
    }

    const photo = await db.photo.create({
      data: {
        title,
        description: description ?? null,
        imageUrl,
        authorId: currentUser.id,
        categoryId: categoryId ?? null,
        location: location ?? null,
        license,
        watermarked,
        isAdult,
        tags:
          tags.length > 0
            ? {
                create: await Promise.all(
                  tags.map(async (name) => {
                    const tag = await db.tag.upsert({
                      where: { name: name.toLowerCase() },
                      update: {},
                      create: { name: name.toLowerCase() },
                    })
                    return { tagId: tag.id }
                  })
                ),
              }
            : undefined,
        exif: exif
          ? {
              create: {
                camera: exif.camera ?? null,
                lens: exif.lens ?? null,
                focalLength: exif.focalLength ?? null,
                aperture: exif.aperture ?? null,
                shutterSpeed: exif.shutterSpeed ?? null,
                iso: exif.iso ?? null,
                takenAt: exif.takenAt ? new Date(exif.takenAt) : null,
              },
            }
          : undefined,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        tags: { include: { tag: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
        exif: true,
      },
    })

    // Initial pulse score (0 — no likes/comments/views yet)
    await recalcPulseScore(photo.id)

    return NextResponse.json({
      id: photo.id,
      title: photo.title,
      description: photo.description,
      imageUrl: photo.imageUrl,
      createdAt: photo.createdAt,
      author: photo.author,
      tags: photo.tags.map((t) => t.tag.name),
      category: photo.category,
      location: photo.location,
      license: photo.license,
      watermarked: photo.watermarked,
      isAdult: photo.isAdult,
      isEditorPick: photo.isEditorPick,
      pulseScore: photo.pulseScore,
      exif: photo.exif,
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
      saveCount: 0,
      likedByMe: false,
    })
  } catch (err) {
    console.error("[photos] POST error", err)
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    )
  }
}

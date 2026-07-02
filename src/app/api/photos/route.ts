import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const createPhotoSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().min(1, "Image is required"),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional().nullable(),
  isAdult: z.boolean().optional().default(false),
  license: z.enum(["cc0", "cc-by", "cc-by-nc", "all-rights"]).optional().default("all-rights"),
  watermarked: z.boolean().optional().default(false),
  location: z.string().max(200).optional().nullable(),
  exif: z.object({
    camera: z.string().optional().nullable(),
    lens: z.string().optional().nullable(),
    focalLength: z.string().optional().nullable(),
    aperture: z.string().optional().nullable(),
    shutterSpeed: z.string().optional().nullable(),
    iso: z.string().optional().nullable(),
    takenAt: z.string().optional().nullable(),
  }).optional().nullable(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const authorId = searchParams.get("authorId")
    const cursor = searchParams.get("cursor") ?? undefined
    const take = Math.min(parseInt(searchParams.get("take") ?? "12", 10), 50)

    const where: Record<string, unknown> = {}
    if (authorId) where.authorId = authorId

    const categoryId = searchParams.get("categoryId")
    if (categoryId) where.categoryId = categoryId

    const search = searchParams.get("search")
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { some: { tag: { name: { contains: search } } } } },
        { author: { username: { contains: search } } },
      ]
    }

    const currentUser = await getCurrentUser()

    // NSFW filter: hide adult photos unless the current user opted in
    const showAdult = currentUser?.showAdultContent === true
    if (!showAdult) {
      where.isAdult = false
    }

    // Sort options: newest, popular, pulse, trending
    const sort = searchParams.get("sort") ?? "newest"
    let orderBy: Record<string, unknown> = { createdAt: "desc" as const }
    if (sort === "popular") orderBy = { likes: { _count: "desc" as const } }
    else if (sort === "pulse") orderBy = { pulseScore: "desc" as const }
    else if (sort === "trending") {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      where.createdAt = { gte: sevenDaysAgo }
      orderBy = { pulseScore: "desc" as const }
    }

    const photos = await db.photo.findMany({
      where,
      orderBy,
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        tags: { include: { tag: true } },
        category: { select: { id: true, name: true, slug: true, icon: true, isAdult: true } },
        _count: { select: { likes: true, comments: true } },
        ...(currentUser
          ? {
              likes: {
                where: { userId: currentUser.id },
                select: { id: true },
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
        isAdult: p.isAdult,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        likedByMe: currentUser ? (p.likes?.length ?? 0) > 0 : false,
      })),
      nextCursor,
    })
  } catch (err) {
    console.error("[photos] GET error", err)
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "You must be logged in to upload" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createPhotoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { title, description, imageUrl, tags = [], categoryId, isAdult, license, watermarked, location, exif } = parsed.data

    const photo = await db.photo.create({
      data: {
        title,
        description: description ?? null,
        imageUrl,
        authorId: currentUser.id,
        categoryId: categoryId ?? null,
        isAdult,
        license,
        watermarked,
        location: location ?? null,
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
        exif: exif ? {
          create: {
            camera: exif.camera ?? null,
            lens: exif.lens ?? null,
            focalLength: exif.focalLength ?? null,
            aperture: exif.aperture ?? null,
            shutterSpeed: exif.shutterSpeed ?? null,
            iso: exif.iso ?? null,
            takenAt: exif.takenAt ? new Date(exif.takenAt) : null,
          },
        } : undefined,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        tags: { include: { tag: true } },
        category: { select: { id: true, name: true, slug: true, icon: true, isAdult: true } },
        exif: true,
      },
    })

    return NextResponse.json({
      id: photo.id,
      title: photo.title,
      description: photo.description,
      imageUrl: photo.imageUrl,
      createdAt: photo.createdAt,
      author: photo.author,
      tags: photo.tags.map((t) => t.tag.name),
      category: photo.category,
      isAdult: photo.isAdult,
      likeCount: 0,
      commentCount: 0,
      likedByMe: false,
    })
  } catch (err) {
    console.error("[photos] POST error", err)
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 })
  }
}

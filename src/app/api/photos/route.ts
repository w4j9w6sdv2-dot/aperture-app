import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const createPhotoSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().min(1, "Image is required"),
  tags: z.array(z.string()).optional(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const authorId = searchParams.get("authorId")
    const cursor = searchParams.get("cursor") ?? undefined
    const take = Math.min(parseInt(searchParams.get("take") ?? "12", 10), 50)

    const where: Record<string, unknown> = {}
    if (authorId) where.authorId = authorId

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

    const photos = await db.photo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        tags: { include: { tag: true } },
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

    const { title, description, imageUrl, tags = [] } = parsed.data

    const photo = await db.photo.create({
      data: {
        title,
        description: description ?? null,
        imageUrl,
        authorId: currentUser.id,
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
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        tags: { include: { tag: true } },
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
      likeCount: 0,
      commentCount: 0,
      likedByMe: false,
    })
  } catch (err) {
    console.error("[photos] POST error", err)
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 })
  }
}

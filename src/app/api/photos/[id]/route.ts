import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()

    const photo = await db.photo.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
        tags: { include: { tag: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
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

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // Check if the current user follows the photo's author. Query the Follow
    // table directly to avoid the inverted-by-convention relation names.
    const isFollowingAuthor = currentUser
      ? !!(await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUser.id,
              followingId: photo.author.id,
            },
          },
          select: { id: true },
        }))
      : false

    // bump view count? we don't have a views table — skip for simplicity
    return NextResponse.json({
      id: photo.id,
      title: photo.title,
      description: photo.description,
      imageUrl: photo.imageUrl,
      createdAt: photo.createdAt,
      author: {
        id: photo.author.id,
        username: photo.author.username,
        avatarUrl: photo.author.avatarUrl,
        bio: photo.author.bio,
        isFollowing: isFollowingAuthor,
      },
      tags: photo.tags.map((t) => t.tag.name),
      comments: photo.comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        author: c.author,
      })),
      likeCount: photo._count.likes,
      commentCount: photo._count.comments,
      likedByMe: currentUser ? photo.likes?.length > 0 : false,
    })
  } catch (err) {
    console.error("[photo] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    )
  }
}

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string()).optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const photo = await db.photo.findUnique({ where: { id } })
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }
    if (photo.authorId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { title, description, tags } = parsed.data

    const updated = await db.photo.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(tags !== undefined
          ? {
              tags: {
                deleteMany: {},
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
              },
            }
          : {}),
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      imageUrl: updated.imageUrl,
      createdAt: updated.createdAt,
      author: updated.author,
      tags: updated.tags.map((t) => t.tag.name),
    })
  } catch (err) {
    console.error("[photo] PUT error", err)
    return NextResponse.json(
      { error: "Failed to update photo" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const photo = await db.photo.findUnique({ where: { id } })
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }
    if (photo.authorId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.photo.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[photo] DELETE error", err)
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    )
  }
}

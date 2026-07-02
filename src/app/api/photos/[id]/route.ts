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
            location: true,
            websiteUrl: true,
          },
        },
        tags: { include: { tag: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
        exif: true,
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
        contestEntries: {
          include: {
            contest: {
              select: {
                id: true,
                title: true,
                theme: true,
                status: true,
                endsAt: true,
              },
            },
            _count: { select: { votes: true } },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
            savedIn: true,
          },
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

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // NSFW check: hide adult content from users who haven't opted in
    // (the photo author can always view their own photo)
    if (photo.isAdult && currentUser?.id !== photo.author.id) {
      if (!currentUser || !currentUser.showAdultContent) {
        return NextResponse.json(
          { error: "This content is for adults only. Enable NSFW in your profile settings to view it." },
          { status: 403 }
        )
      }
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
        location: photo.author.location,
        websiteUrl: photo.author.websiteUrl,
        isFollowing: isFollowingAuthor,
      },
      tags: photo.tags.map((t) => t.tag.name),
      category: photo.category,
      exif: photo.exif,
      location: photo.location,
      license: photo.license,
      watermarked: photo.watermarked,
      isAdult: photo.isAdult,
      isEditorPick: photo.isEditorPick,
      pulseScore: photo.pulseScore,
      comments: photo.comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        author: c.author,
      })),
      contestEntries: photo.contestEntries.map((ce) => ({
        id: ce.id,
        contestId: ce.contestId,
        contest: ce.contest,
        voteCount: ce._count.votes,
      })),
      likeCount: photo._count.likes,
      commentCount: photo._count.comments,
      viewCount: photo._count.views,
      saveCount: photo._count.savedIn,
      likedByMe: currentUser ? photo.likes?.length > 0 : false,
      savedByMe: currentUser ? (photo.savedIn?.length ?? 0) > 0 : false,
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

    // Cascade delete is configured in Prisma schema, but be explicit about
    // related rows so we don't rely on DB-level cascade for orphaned rows.
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

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()

    const collection = await db.collection.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true } },
        photos: {
          orderBy: { addedAt: "desc" },
          include: {
            photo: {
              include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                tags: { include: { tag: true } },
                _count: { select: { likes: true, comments: true } },
                ...(currentUser
                  ? { likes: { where: { userId: currentUser.id }, select: { id: true } } }
                  : {}),
              },
            },
          },
        },
      },
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    // Privacy check
    if (collection.isPrivate && collection.ownerId !== currentUser?.id) {
      return NextResponse.json({ error: "This collection is private" }, { status: 403 })
    }

    return NextResponse.json({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isPrivate: collection.isPrivate,
      createdAt: collection.createdAt,
      owner: collection.owner,
      isOwner: collection.ownerId === currentUser?.id,
      photos: collection.photos.map((sp) => ({
        id: sp.photo.id,
        title: sp.photo.title,
        description: sp.photo.description,
        imageUrl: sp.photo.imageUrl,
        createdAt: sp.photo.createdAt,
        author: sp.photo.author,
        tags: sp.photo.tags.map((t) => t.tag.name),
        isAdult: sp.photo.isAdult,
        likeCount: sp.photo._count.likes,
        commentCount: sp.photo._count.comments,
        likedByMe: currentUser ? (sp.photo.likes?.length ?? 0) > 0 : false,
        savedAt: sp.addedAt,
      })),
    })
  } catch (err) {
    console.error("[collection detail] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
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

    const collection = await db.collection.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!collection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (collection.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.collection.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[collection DELETE] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

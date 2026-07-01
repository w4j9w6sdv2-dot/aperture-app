import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/collections/[id] — collection detail with photos
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
        owner: {
          select: { id: true, username: true, avatarUrl: true },
        },
        photos: {
          orderBy: { addedAt: "desc" },
          include: {
            photo: {
              include: {
                author: {
                  select: { id: true, username: true, avatarUrl: true },
                },
                tags: { include: { tag: true } },
                _count: {
                  select: { likes: true, comments: true, views: true },
                },
              },
            },
          },
        },
      },
    })

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      )
    }

    // Privacy check: only the owner can see private collections
    if (collection.isPrivate && collection.ownerId !== currentUser?.id) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isPrivate: collection.isPrivate,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      owner: collection.owner,
      isOwner: collection.ownerId === currentUser?.id,
      photos: collection.photos.map((sp) => ({
        savedPhotoId: sp.id,
        addedAt: sp.addedAt,
        id: sp.photo.id,
        title: sp.photo.title,
        description: sp.photo.description,
        imageUrl: sp.photo.imageUrl,
        createdAt: sp.photo.createdAt,
        author: sp.photo.author,
        tags: sp.photo.tags.map((t) => t.tag.name),
        likeCount: sp.photo._count.likes,
        commentCount: sp.photo._count.comments,
        viewCount: sp.photo._count.views,
        pulseScore: sp.photo.pulseScore,
      })),
    })
  } catch (err) {
    console.error("[collection] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 }
    )
  }
}

// DELETE /api/collections/[id] — delete a collection (owner only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      )
    }

    const collection = await db.collection.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    })

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      )
    }

    if (collection.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.collection.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[collection] DELETE error", err)
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    )
  }
}

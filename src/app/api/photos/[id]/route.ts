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

    const photo = await db.photo.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
          },
        },
        tags: { include: { tag: true } },
        category: { select: { id: true, name: true, slug: true, icon: true, isAdult: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
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

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // NSFW gate: author can always see own photo, others need opt-in
    if (photo.isAdult && currentUser?.id !== photo.author.id) {
      if (!currentUser || !currentUser.showAdultContent) {
        return NextResponse.json(
          { error: "This content is for adults only. Enable NSFW in your settings to view it." },
          { status: 403 }
        )
      }
    }

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
      comments: photo.comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        author: c.author,
      })),
      likeCount: photo._count.likes,
      commentCount: photo._count.comments,
      likedByMe: currentUser ? (photo.likes?.length ?? 0) > 0 : false,
    })
  } catch (err) {
    console.error("[photo detail] error", err)
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 })
  }
}

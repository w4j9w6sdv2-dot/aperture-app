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

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        photos: {
          orderBy: { createdAt: "desc" },
          include: {
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
        },
        _count: {
          select: { photos: true, likes: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Count total likes received across all photos
    const totalLikesReceived = await db.like.count({
      where: { photo: { authorId: id } },
    })

    return NextResponse.json({
      id: user.id,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      isMe: currentUser?.id === id,
      photoCount: user._count.photos,
      likesReceived: totalLikesReceived,
      photos: user.photos.map((p) => ({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        likedByMe: currentUser ? (p.likes?.length ?? 0) > 0 : false,
      })),
    })
  } catch (err) {
    console.error("[user profile] error", err)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

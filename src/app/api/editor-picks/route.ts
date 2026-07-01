import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/editor-picks — photos where isEditorPick = true
export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    const photos = await db.photo.findMany({
      where: { isEditorPick: true },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        tags: { include: { tag: true } },
        _count: {
          select: { likes: true, comments: true, views: true, savedIn: true },
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

    return NextResponse.json({
      items: photos.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
        author: p.author,
        tags: p.tags.map((t) => t.tag.name),
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        viewCount: p._count.views,
        saveCount: p._count.savedIn,
        pulseScore: p.pulseScore,
        isEditorPick: p.isEditorPick,
        likedByMe: currentUser ? p.likes?.length > 0 : false,
      })),
    })
  } catch (err) {
    console.error("[editor-picks] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch editor picks" },
      { status: 500 }
    )
  }
}

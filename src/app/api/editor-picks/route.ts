import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    const showAdult = currentUser?.showAdultContent === true

    const photos = await db.photo.findMany({
      where: {
        isEditorPick: true,
        ...(showAdult ? {} : { isAdult: false }),
      },
      orderBy: { createdAt: "desc" },
      take: 24,
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        tags: { include: { tag: true } },
        category: { select: { id: true, name: true, slug: true, icon: true, isAdult: true } },
        _count: { select: { likes: true, comments: true } },
        ...(currentUser
          ? { likes: { where: { userId: currentUser.id }, select: { id: true } } }
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
        category: p.category,
        isAdult: p.isAdult,
        isEditorPick: p.isEditorPick,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        likedByMe: currentUser ? (p.likes?.length ?? 0) > 0 : false,
      })),
    })
  } catch (err) {
    console.error("[editor-picks] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

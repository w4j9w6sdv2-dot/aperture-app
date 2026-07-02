import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already liked
    const existing = await db.like.findUnique({
      where: { userId_photoId: { userId: currentUser.id, photoId } },
    })

    if (existing) {
      // Unlike
      await db.like.delete({ where: { id: existing.id } })
      const likeCount = await db.like.count({ where: { photoId } })
      return NextResponse.json({ liked: false, likeCount })
    } else {
      // Like
      await db.like.create({ data: { userId: currentUser.id, photoId } })
      const likeCount = await db.like.count({ where: { photoId } })
      return NextResponse.json({ liked: true, likeCount })
    }
  } catch (err) {
    console.error("[like] error", err)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// Toggle like
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to like photos" },
        { status: 401 }
      )
    }

    const photo = await db.photo.findUnique({ where: { id } })
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    const existing = await db.like.findUnique({
      where: {
        userId_photoId: { userId: currentUser.id, photoId: id },
      },
    })

    if (existing) {
      await db.like.delete({ where: { id: existing.id } })
      const count = await db.like.count({ where: { photoId: id } })
      return NextResponse.json({ liked: false, likeCount: count })
    }

    await db.like.create({
      data: { userId: currentUser.id, photoId: id },
    })
    const count = await db.like.count({ where: { photoId: id } })
    return NextResponse.json({ liked: true, likeCount: count })
  } catch (err) {
    console.error("[like] error", err)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}

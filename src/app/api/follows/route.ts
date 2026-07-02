import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { followingId } = body
    if (!followingId || followingId === currentUser.id) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 })
    }

    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId,
        },
      },
    })

    if (existing) {
      await db.follow.delete({ where: { id: existing.id } })
      return NextResponse.json({ following: false })
    } else {
      await db.follow.create({ data: { followerId: currentUser.id, followingId } })
      return NextResponse.json({ following: true })
    }
  } catch (err) {
    console.error("[follows] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

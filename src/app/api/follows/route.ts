import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const followSchema = z.object({
  followingId: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to follow users" },
        { status: 401 }
      )
    }

    const json = await req.json()
    const parsed = followSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { followingId } = parsed.data
    if (followingId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      )
    }

    const target = await db.user.findUnique({ where: { id: followingId } })
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // toggle: if already following, unfollow; otherwise follow
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
    }

    await db.follow.create({
      data: { followerId: currentUser.id, followingId },
    })
    return NextResponse.json({ following: true })
  } catch (err) {
    console.error("[follows] POST error", err)
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    )
  }
}

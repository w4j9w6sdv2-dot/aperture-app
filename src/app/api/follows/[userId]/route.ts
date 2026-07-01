import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// DELETE /api/follows/:userId — unfollow the user with this id
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ following: false })
    }

    await db.follow.delete({ where: { id: existing.id } })
    return NextResponse.json({ following: false })
  } catch (err) {
    console.error("[follows] DELETE error", err)
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    )
  }
}

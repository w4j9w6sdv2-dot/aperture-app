import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/messages/[userId] — get conversation with specific user
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: otherUserId } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUser.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    })

    // Mark received messages as read
    await db.message.updateMany({
      where: { senderId: otherUserId, receiverId: currentUser.id, read: false },
      data: { read: true },
    })

    return NextResponse.json({ items: messages })
  } catch (err) {
    console.error("[messages detail] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

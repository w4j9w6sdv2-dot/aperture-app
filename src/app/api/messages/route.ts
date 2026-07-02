import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/messages — list conversations (latest message per user pair)
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get all users I've exchanged messages with
    const sent = await db.message.findMany({
      where: { senderId: currentUser.id },
      select: { receiverId: true },
      distinct: ["receiverId"],
    })
    const received = await db.message.findMany({
      where: { receiverId: currentUser.id },
      select: { senderId: true },
      distinct: ["senderId"],
    })

    const userIds = new Set([
      ...sent.map((m) => m.receiverId),
      ...received.map((m) => m.senderId),
    ])

    const conversations = []
    for (const uid of userIds) {
      const otherUser = await db.user.findUnique({
        where: { id: uid },
        select: { id: true, username: true, avatarUrl: true },
      })
      if (!otherUser) continue

      const lastMessage = await db.message.findFirst({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: uid },
            { senderId: uid, receiverId: currentUser.id },
          ],
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, body: true, createdAt: true, senderId: true, read: true },
      })

      const unreadCount = await db.message.count({
        where: { senderId: uid, receiverId: currentUser.id, read: false },
      })

      conversations.push({ user: otherUser, lastMessage, unreadCount })
    }

    // Sort by latest message
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt?.getTime() ?? 0
      const bTime = b.lastMessage?.createdAt?.getTime() ?? 0
      return bTime - aTime
    })

    return NextResponse.json({ items: conversations })
  } catch (err) {
    console.error("[messages] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/messages — send a message
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { receiverId, body: messageBody } = body
    if (!receiverId || !messageBody?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }
    if (receiverId === currentUser.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
    }

    const message = await db.message.create({
      data: { senderId: currentUser.id, receiverId, body: messageBody.trim() },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId: receiverId,
        type: "message",
        actorId: currentUser.id,
        text: `${currentUser.username} sent you a message`,
      },
    })

    return NextResponse.json(message)
  } catch (err) {
    console.error("[messages POST] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

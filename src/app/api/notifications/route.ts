import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/notifications — current user's notifications (latest 30)
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ items: [] })
    }

    const notifications = await db.notification.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        actor: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    })

    return NextResponse.json({
      items: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        text: n.text,
        read: n.read,
        createdAt: n.createdAt,
        actorId: n.actorId,
        photoId: n.photoId,
        actor: n.actor,
      })),
    })
  } catch (err) {
    console.error("[notifications] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications — mark all as read
export async function PATCH() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      )
    }

    const result = await db.notification.updateMany({
      where: { userId: currentUser.id, read: false },
      data: { read: true },
    })

    return NextResponse.json({ updated: result.count })
  } catch (err) {
    console.error("[notifications] PATCH error", err)
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await db.notification.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        type: true,
        actorId: true,
        photoId: true,
        text: true,
        read: true,
        createdAt: true,
      },
    })

    const unreadCount = await db.notification.count({
      where: { userId: currentUser.id, read: false },
    })

    return NextResponse.json({
      items: notifications,
      unreadCount,
    })
  } catch (err) {
    console.error("[notifications GET] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.notification.updateMany({
      where: { userId: currentUser.id, read: false },
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[notifications PATCH] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

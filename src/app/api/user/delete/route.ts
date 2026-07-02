import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 })
    }

    // Verify password before deleting
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: "Wrong password" }, { status: 403 })
    }

    // Delete user — cascade will remove photos, comments, likes, follows,
    // collections, savedPhotos, contestEntries, contestVotes, notifications, views, messages
    await db.user.delete({ where: { id: session.user.id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[user delete] error", err)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const comment = await db.comment.findUnique({ where: { id } })
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }
    if (comment.authorId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.comment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[comment] DELETE error", err)
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    )
  }
}

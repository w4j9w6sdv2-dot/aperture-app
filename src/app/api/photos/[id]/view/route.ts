import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params
    const currentUser = await getCurrentUser()

    // Create a view record
    await db.photoView.create({
      data: {
        photoId,
        userId: currentUser?.id ?? null,
      },
    })

    // Count total views
    const viewCount = await db.photoView.count({ where: { photoId } })

    return NextResponse.json({ counted: true, viewCount })
  } catch (err) {
    console.error("[view] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

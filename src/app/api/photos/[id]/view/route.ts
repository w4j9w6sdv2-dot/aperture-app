import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { recalcPulseScore } from "@/lib/pulse"

// POST /api/photos/[id]/view — increment view count + recalc pulse score
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()

    const photo = await db.photo.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    })

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // Don't count the author's own views
    if (currentUser?.id === photo.authorId) {
      return NextResponse.json({ counted: false, viewCount: await db.photoView.count({ where: { photoId: id } }) })
    }

    await db.photoView.create({
      data: {
        photoId: id,
        userId: currentUser?.id ?? null,
      },
    })

    const newScore = await recalcPulseScore(id)
    const viewCount = await db.photoView.count({ where: { photoId: id } })

    return NextResponse.json({
      counted: true,
      viewCount,
      pulseScore: newScore,
    })
  } catch (err) {
    console.error("[view] POST error", err)
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    )
  }
}

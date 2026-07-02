import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const enterSchema = z.object({
  photoId: z.string().min(1),
})

// POST /api/contests/[id]/entries — enter a photo into the contest
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to enter a contest" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = enterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { photoId } = parsed.data

    const contest = await db.contest.findUnique({
      where: { id },
      select: { id: true, status: true, endsAt: true },
    })
    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      )
    }
    if (contest.status === "ended" || new Date() > contest.endsAt) {
      return NextResponse.json(
        { error: "Contest has ended" },
        { status: 400 }
      )
    }

    // Verify photo exists and belongs to the user
    const photo = await db.photo.findUnique({
      where: { id: photoId },
      select: { id: true, authorId: true },
    })
    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      )
    }
    if (photo.authorId !== currentUser.id) {
      return NextResponse.json(
        { error: "You can only enter your own photos" },
        { status: 403 }
      )
    }

    // Upsert entry (idempotent — same photo can't be entered twice)
    const entry = await db.contestEntry.upsert({
      where: {
        contestId_photoId: { contestId: id, photoId },
      },
      update: {},
      create: {
        contestId: id,
        photoId,
        userId: currentUser.id,
      },
    })

    return NextResponse.json({
      id: entry.id,
      contestId: entry.contestId,
      photoId: entry.photoId,
      createdAt: entry.createdAt,
    })
  } catch (err) {
    console.error("[entries] POST error", err)
    return NextResponse.json(
      { error: "Failed to enter contest" },
      { status: 500 }
    )
  }
}

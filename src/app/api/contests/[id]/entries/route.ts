import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const enterSchema = z.object({
  photoId: z.string().min(1, "Photo is required"),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contestId } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = enterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Photo is required" }, { status: 400 })
    }

    const { photoId } = parsed.data

    // Verify contest exists and is active
    const contest = await db.contest.findUnique({
      where: { id: contestId },
      select: { id: true, status: true, endsAt: true },
    })
    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 })
    }
    if (contest.status !== "active" || contest.endsAt < new Date()) {
      return NextResponse.json({ error: "Contest has ended" }, { status: 400 })
    }

    // Verify photo belongs to the user
    const photo = await db.photo.findUnique({
      where: { id: photoId },
      select: { id: true, authorId: true },
    })
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }
    if (photo.authorId !== currentUser.id) {
      return NextResponse.json({ error: "You can only enter your own photos" }, { status: 403 })
    }

    // Check if user already entered this contest (one entry per user per contest)
    const existingEntry = await db.contestEntry.findFirst({
      where: { contestId, userId: currentUser.id },
      select: { id: true },
    })
    if (existingEntry) {
      return NextResponse.json({ error: "You already entered this contest" }, { status: 400 })
    }

    // Check if photo is already entered (unique constraint will catch this too)
    const existingPhoto = await db.contestEntry.findUnique({
      where: { contestId_photoId: { contestId, photoId } },
      select: { id: true },
    })
    if (existingPhoto) {
      return NextResponse.json({ error: "This photo is already in the contest" }, { status: 400 })
    }

    const entry = await db.contestEntry.create({
      data: {
        contestId,
        photoId,
        userId: currentUser.id,
      },
    })

    return NextResponse.json({ id: entry.id, contestId, photoId })
  } catch (err) {
    console.error("[contest entry] error", err)
    return NextResponse.json({ error: "Failed to enter contest" }, { status: 500 })
  }
}

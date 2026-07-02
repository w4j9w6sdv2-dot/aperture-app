import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const voteSchema = z.object({
  entryId: z.string().min(1, "Entry is required"),
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
    const parsed = voteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Entry is required" }, { status: 400 })
    }

    const { entryId } = parsed.data

    // Verify contest is active
    const contest = await db.contest.findUnique({
      where: { id: contestId },
      select: { status: true, endsAt: true },
    })
    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 })
    }
    if (contest.status !== "active" || contest.endsAt < new Date()) {
      return NextResponse.json({ error: "Contest has ended" }, { status: 400 })
    }

    // Verify entry exists and belongs to this contest
    const entry = await db.contestEntry.findUnique({
      where: { id: entryId },
      select: { id: true, contestId: true },
    })
    if (!entry || entry.contestId !== contestId) {
      return NextResponse.json({ error: "Invalid entry" }, { status: 400 })
    }

    // Check if user already voted in this contest
    const existingVote = await db.contestVote.findFirst({
      where: { contestId, userId: currentUser.id },
      select: { id: true, entryId: true },
    })

    if (existingVote) {
      // If voting for the same entry, unvote (toggle off)
      if (existingVote.entryId === entryId) {
        await db.contestVote.delete({ where: { id: existingVote.id } })
        return NextResponse.json({ voted: false, entryId })
      }
      // Otherwise, move vote to new entry
      await db.contestVote.delete({ where: { id: existingVote.id } })
    }

    // Create vote
    await db.contestVote.create({
      data: { contestId, entryId, userId: currentUser.id },
    })

    return NextResponse.json({ voted: true, entryId })
  } catch (err) {
    console.error("[contest vote] error", err)
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 })
  }
}

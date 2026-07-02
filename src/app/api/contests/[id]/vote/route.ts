import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const voteSchema = z.object({
  entryId: z.string().min(1),
})

// POST /api/contests/[id]/vote — vote for an entry (one vote per user per contest)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to vote" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = voteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { entryId } = parsed.data

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
        { error: "Voting has ended" },
        { status: 400 }
      )
    }

    // Verify entry belongs to this contest
    const entry = await db.contestEntry.findUnique({
      where: { id: entryId },
      select: { id: true, contestId: true },
    })
    if (!entry || entry.contestId !== id) {
      return NextResponse.json(
        { error: "Entry not found in this contest" },
        { status: 404 }
      )
    }

    // Check existing vote
    const existing = await db.contestVote.findUnique({
      where: {
        contestId_userId: { contestId: id, userId: currentUser.id },
      },
    })

    if (existing) {
      // Move the vote (delete old, create new) — or no-op if same entry
      if (existing.entryId === entryId) {
        // un-vote
        await db.contestVote.delete({ where: { id: existing.id } })
        const voteCount = await db.contestVote.count({
          where: { entryId },
        })
        return NextResponse.json({
          voted: false,
          entryId,
          voteCount,
        })
      }

      await db.contestVote.update({
        where: { id: existing.id },
        data: { entryId },
      })
      const voteCount = await db.contestVote.count({
        where: { entryId },
      })
      return NextResponse.json({
        voted: true,
        entryId,
        voteCount,
        changed: true,
      })
    }

    await db.contestVote.create({
      data: {
        contestId: id,
        entryId,
        userId: currentUser.id,
      },
    })

    const voteCount = await db.contestVote.count({
      where: { entryId },
    })

    return NextResponse.json({
      voted: true,
      entryId,
      voteCount,
    })
  } catch (err) {
    console.error("[vote] POST error", err)
    return NextResponse.json(
      { error: "Failed to vote" },
      { status: 500 }
    )
  }
}

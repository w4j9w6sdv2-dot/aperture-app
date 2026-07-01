import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/contests — list contests (optionally filter by status)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") // "active" | "voting" | "ended" | undefined (all)

    const contests = await db.contest.findMany({
      where: status ? { status } : undefined,
      orderBy: { endsAt: "asc" },
      include: {
        _count: {
          select: { entries: true, votes: true },
        },
      },
    })

    return NextResponse.json({
      items: contests.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        theme: c.theme,
        prize: c.prize,
        startsAt: c.startsAt,
        endsAt: c.endsAt,
        status: c.status,
        bannerUrl: c.bannerUrl,
        createdAt: c.createdAt,
        entryCount: c._count.entries,
        voteCount: c._count.votes,
      })),
    })
  } catch (err) {
    console.error("[contests] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch contests" },
      { status: 500 }
    )
  }
}

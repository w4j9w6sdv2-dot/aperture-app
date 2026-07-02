import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const now = new Date()
    const contests = await db.contest.findMany({
      where: {
        status: "active",
        endsAt: { gte: now },
      },
      orderBy: { endsAt: "asc" },
      include: {
        _count: { select: { entries: true, votes: true } },
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
        entryCount: c._count.entries,
        voteCount: c._count.votes,
      })),
    })
  } catch (err) {
    console.error("[contests] error", err)
    return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 })
  }
}

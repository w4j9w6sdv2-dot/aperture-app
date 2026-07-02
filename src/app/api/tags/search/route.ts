import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") ?? "").trim().toLowerCase()

    if (!q) {
      return NextResponse.json({ items: [] })
    }

    const tags = await db.tag.findMany({
      where: {
        // SQLite is case-insensitive for ASCII by default.
        name: { contains: q },
      },
      orderBy: {
        photos: { _count: "desc" },
      },
      take: 10,
      select: {
        id: true,
        name: true,
        _count: { select: { photos: true } },
      },
    })

    return NextResponse.json({
      items: tags.map((t) => ({
        id: t.id,
        name: t.name,
        count: t._count.photos,
      })),
    })
  } catch (err) {
    console.error("[tags/search] error", err)
    return NextResponse.json(
      { error: "Failed to search tags" },
      { status: 500 }
    )
  }
}

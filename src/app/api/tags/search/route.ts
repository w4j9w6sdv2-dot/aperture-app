import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") ?? "").toLowerCase().trim()

    if (!q) {
      return NextResponse.json({ items: [] })
    }

    const tags = await db.tag.findMany({
      where: { name: { contains: q } },
      take: 10,
      orderBy: { photos: { _count: "desc" } },
      select: { id: true, name: true, _count: { select: { photos: true } } },
    })

    return NextResponse.json({
      items: tags.map((t) => ({ id: t.id, name: t.name, count: t._count.photos })),
    })
  } catch (err) {
    console.error("[tags search] error", err)
    return NextResponse.json({ error: "Failed to search tags" }, { status: 500 })
  }
}

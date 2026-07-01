import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const tags = await db.tag.findMany({
      orderBy: {
        photos: { _count: "desc" },
      },
      take: 30,
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
    console.error("[tags] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    )
  }
}

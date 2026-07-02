import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { photos: true },
        },
      },
    })

    return NextResponse.json({
      items: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        photoCount: c._count.photos,
      })),
    })
  } catch (err) {
    console.error("[categories] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

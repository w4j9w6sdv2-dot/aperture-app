import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Show ALL categories (including adult) so users can see them in the menu.
    // The NSFW gate triggers when they click on an adult category.
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { photos: true } },
      },
    })

    return NextResponse.json({
      items: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        isAdult: c.isAdult,
        photoCount: c._count.photos,
      })),
    })
  } catch (err) {
    console.error("[categories] error", err)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

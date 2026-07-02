import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    const showAdult = currentUser?.showAdultContent === true

    const categories = await db.category.findMany({
      where: showAdult ? {} : { isAdult: false },
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

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Use raw SQL to bypass any Prisma Client caching issues
    const categories = await db.$queryRaw`
      SELECT c.id, c.name, c.slug, c.icon, c."isAdult", COALESCE(p.cnt, 0) as "photoCount"
      FROM "Category" c
      LEFT JOIN (SELECT "categoryId", COUNT(*) as cnt FROM "Photo" WHERE "categoryId" IS NOT NULL GROUP BY "categoryId") p
      ON c.id = p."categoryId"
      ORDER BY c.name ASC
    ` as Array<{ id: string; name: string; slug: string; icon: string | null; isAdult: boolean; photoCount: bigint }>

    return NextResponse.json({
      items: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        isAdult: c.isAdult,
        photoCount: Number(c.photoCount),
      })),
    })
  } catch (err) {
    console.error("[categories] error", err)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

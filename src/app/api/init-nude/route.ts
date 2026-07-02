import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST() {
  try {
    const cat = await db.category.upsert({
      where: { slug: "nude" },
      update: { isAdult: true },
      create: { name: "Nude", slug: "nude", icon: "Eye", isAdult: true },
    })
    const count = await db.category.count()
    const all = await db.category.findMany({ select: { name: true, slug: true, isAdult: true } })
    return NextResponse.json({ success: true, category: cat, totalCategories: count, all })
  } catch (err) {
    console.error("[init-nude] error", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

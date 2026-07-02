import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  description: z.string().max(500).optional().nullable(),
  isPrivate: z.boolean().optional().default(false),
})

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const collections = await db.collection.findMany({
      where: { ownerId: currentUser.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { photos: true } },
        photos: {
          take: 4,
          orderBy: { addedAt: "desc" },
          include: { photo: { select: { id: true, imageUrl: true } } },
        },
      },
    })

    return NextResponse.json({
      items: collections.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isPrivate: c.isPrivate,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        photoCount: c._count.photos,
        thumbnails: c.photos.map((sp) => sp.photo.imageUrl),
      })),
    })
  } catch (err) {
    console.error("[collections GET] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createCollectionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const collection = await db.collection.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        isPrivate: parsed.data.isPrivate,
        ownerId: currentUser.id,
      },
    })

    return NextResponse.json({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isPrivate: collection.isPrivate,
      createdAt: collection.createdAt,
      photoCount: 0,
    })
  } catch (err) {
    console.error("[collections POST] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

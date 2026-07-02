import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  isPrivate: z.boolean().optional(),
})

// GET /api/collections — current user's collections (with photo counts)
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      )
    }

    const collections = await db.collection.findMany({
      where: { ownerId: currentUser.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { photos: true } },
        photos: {
          take: 4,
          orderBy: { addedAt: "desc" },
          include: {
            photo: {
              select: { id: true, imageUrl: true, title: true },
            },
          },
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
        thumbnails: c.photos.map((sp) => sp.photo),
      })),
    })
  } catch (err) {
    console.error("[collections] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    )
  }
}

// POST /api/collections — create a new collection
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { name, description, isPrivate } = parsed.data

    const collection = await db.collection.create({
      data: {
        name,
        description: description ?? null,
        isPrivate: isPrivate ?? false,
        ownerId: currentUser.id,
      },
    })

    return NextResponse.json({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isPrivate: collection.isPrivate,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      photoCount: 0,
      thumbnails: [],
    })
  } catch (err) {
    console.error("[collections] POST error", err)
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    )
  }
}

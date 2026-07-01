import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { recalcPulseScore } from "@/lib/pulse"

const saveSchema = z.object({
  collectionId: z.string().min(1),
})

// POST /api/photos/[id]/save — save photo to a collection
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to save photos" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = saveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { collectionId } = parsed.data

    // Verify collection ownership
    const collection = await db.collection.findUnique({
      where: { id: collectionId },
      select: { id: true, ownerId: true },
    })
    if (!collection || collection.ownerId !== currentUser.id) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      )
    }

    // Verify photo exists
    const photo = await db.photo.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // Upsert save (idempotent)
    const saved = await db.savedPhoto.upsert({
      where: {
        collectionId_photoId: { collectionId, photoId: id },
      },
      update: {},
      create: { collectionId, photoId: id },
    })

    await recalcPulseScore(id)

    return NextResponse.json({
      saved: true,
      savedPhotoId: saved.id,
    })
  } catch (err) {
    console.error("[save] POST error", err)
    return NextResponse.json(
      { error: "Failed to save photo" },
      { status: 500 }
    )
  }
}

// DELETE /api/photos/[id]/save?collectionId=xxx — remove photo from collection
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const collectionId = searchParams.get("collectionId")
    if (!collectionId) {
      return NextResponse.json(
        { error: "collectionId is required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const collection = await db.collection.findUnique({
      where: { id: collectionId },
      select: { id: true, ownerId: true },
    })
    if (!collection || collection.ownerId !== currentUser.id) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      )
    }

    try {
      await db.savedPhoto.delete({
        where: {
          collectionId_photoId: { collectionId, photoId: id },
        },
      })
    } catch {
      // already not saved — that's fine
    }

    await recalcPulseScore(id)

    return NextResponse.json({ saved: false })
  } catch (err) {
    console.error("[save] DELETE error", err)
    return NextResponse.json(
      { error: "Failed to remove photo" },
      { status: 500 }
    )
  }
}

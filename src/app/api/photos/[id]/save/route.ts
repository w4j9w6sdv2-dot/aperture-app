import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// POST /api/photos/[id]/save — save photo to a collection
// Body: { collectionId: string } — if not provided, creates a "Saved" collection
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    let collectionId = body.collectionId as string | undefined

    // If no collectionId, create a default "Saved" collection
    if (!collectionId) {
      let defaultCol = await db.collection.findFirst({
        where: { ownerId: currentUser.id, name: "Saved" },
        select: { id: true },
      })
      if (!defaultCol) {
        defaultCol = await db.collection.create({
          data: { name: "Saved", ownerId: currentUser.id },
          select: { id: true },
        })
      }
      collectionId = defaultCol.id
    }

    // Verify collection belongs to user
    const col = await db.collection.findUnique({
      where: { id: collectionId },
      select: { ownerId: true },
    })
    if (!col || col.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "Invalid collection" }, { status: 400 })
    }

    // Save (upsert — ignore if already saved)
    const saved = await db.savedPhoto.upsert({
      where: { collectionId_photoId: { collectionId, photoId } },
      update: {},
      create: { collectionId, photoId },
    })

    return NextResponse.json({ saved: true, id: saved.id, collectionId })
  } catch (err) {
    console.error("[save POST] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// DELETE /api/photos/[id]/save?collectionId=xxx — remove photo from collection
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const collectionId = searchParams.get("collectionId")

    if (collectionId) {
      // Remove from specific collection
      await db.savedPhoto.deleteMany({
        where: { collectionId, photoId, collection: { ownerId: currentUser.id } },
      })
    } else {
      // Remove from ALL user's collections
      await db.savedPhoto.deleteMany({
        where: { photoId, collection: { ownerId: currentUser.id } },
      })
    }

    return NextResponse.json({ saved: false })
  } catch (err) {
    console.error("[save DELETE] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const photo = await db.photo.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
          },
        },
        tags: { include: { tag: true } },
      },
    })

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: photo.id,
      title: photo.title,
      description: photo.description,
      imageUrl: photo.imageUrl,
      createdAt: photo.createdAt,
      author: photo.author,
      tags: photo.tags.map((t) => t.tag.name),
    })
  } catch (err) {
    console.error("[photo detail] error", err)
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 })
  }
}

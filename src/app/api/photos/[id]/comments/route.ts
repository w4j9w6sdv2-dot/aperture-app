import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comments = await db.comment.findMany({
      where: { photoId: id },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    })

    return NextResponse.json({
      items: comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        author: c.author,
      })),
    })
  } catch (err) {
    console.error("[comments] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}

const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(1000),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to comment" },
        { status: 401 }
      )
    }

    const photo = await db.photo.findUnique({ where: { id } })
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    const json = await req.json()
    const parsed = createCommentSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const comment = await db.comment.create({
      data: {
        body: parsed.data.body,
        authorId: currentUser.id,
        photoId: id,
      },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    })

    return NextResponse.json({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      author: comment.author,
    })
  } catch (err) {
    console.error("[comments] POST error", err)
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    )
  }
}

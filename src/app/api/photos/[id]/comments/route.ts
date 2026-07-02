import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(1000),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params

    const comments = await db.comment.findMany({
      where: { photoId },
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
    console.error("[comments GET] error", err)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

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

    const body = await req.json()
    const parsed = createCommentSchema.safeParse(body)
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
        photoId,
      },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    })

    // Create notification for photo owner (don't notify self)
    const photo = await db.photo.findUnique({ where: { id: photoId }, select: { authorId: true } })
    if (photo && photo.authorId !== currentUser.id) {
      await db.notification.create({
        data: {
          userId: photo.authorId,
          type: "comment",
          actorId: currentUser.id,
          photoId,
          text: `${currentUser.username} commented on your photo`,
        },
      })
    }

    return NextResponse.json({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      author: comment.author,
    })
  } catch (err) {
    console.error("[comments POST] error", err)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}

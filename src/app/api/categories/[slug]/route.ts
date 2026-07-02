import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get("cursor") ?? undefined
    const take = Math.min(parseInt(searchParams.get("take") ?? "12", 10), 50)

    const currentUser = await getCurrentUser()

    const category = await db.category.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, icon: true, isAdult: true },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // NSFW gate: hide adult categories from users who haven't opted in
    if (category.isAdult && !currentUser?.showAdultContent) {
      return NextResponse.json(
        { error: "This category contains adult content. Enable NSFW in your settings to view it." },
        { status: 403 }
      )
    }

    const photos = await db.photo.findMany({
      where: { categoryId: category.id },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true } },
        ...(currentUser
          ? { likes: { where: { userId: currentUser.id }, select: { id: true } } }
          : {}),
      },
    })

    const hasNext = photos.length > take
    const items = hasNext ? photos.slice(0, take) : photos
    const nextCursor = hasNext ? items[items.length - 1].id : null

    return NextResponse.json({
      category,
      items: items.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
        author: p.author,
        tags: p.tags.map((t) => t.tag.name),
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        likedByMe: currentUser ? (p.likes?.length ?? 0) > 0 : false,
      })),
      nextCursor,
    })
  } catch (err) {
    console.error("[category detail] error", err)
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 })
  }
}

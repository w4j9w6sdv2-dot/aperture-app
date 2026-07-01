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
    const sort = searchParams.get("sort") ?? "newest" // newest | popular | pulse
    const cursor = searchParams.get("cursor") ?? undefined
    const take = Math.min(parseInt(searchParams.get("take") ?? "12", 10), 50)

    const category = await db.category.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, icon: true },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    const currentUser = await getCurrentUser()

    const orderBy =
      sort === "popular"
        ? { likes: { _count: "desc" as const } }
        : sort === "pulse"
          ? { pulseScore: "desc" as const }
          : { createdAt: "desc" as const }

    const photos = await db.photo.findMany({
      where: { categoryId: category.id },
      orderBy,
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        tags: { include: { tag: true } },
        _count: {
          select: { likes: true, comments: true, views: true, savedIn: true },
        },
        ...(currentUser
          ? {
              likes: {
                where: { userId: currentUser.id },
                select: { id: true },
              },
            }
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
        viewCount: p._count.views,
        saveCount: p._count.savedIn,
        pulseScore: p.pulseScore,
        likedByMe: currentUser ? p.likes?.length > 0 : false,
      })),
      nextCursor,
    })
  } catch (err) {
    console.error("[category] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch category photos" },
      { status: 500 }
    )
  }
}

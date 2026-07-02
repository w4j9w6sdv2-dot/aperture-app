import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = currentUser.id

    // Total photos
    const photoCount = await db.photo.count({ where: { authorId: userId } })

    // Total views across all photos
    const totalViews = await db.photoView.count({
      where: { photo: { authorId: userId } },
    })

    // Total likes received
    const totalLikes = await db.like.count({
      where: { photo: { authorId: userId } },
    })

    // Total comments received
    const totalComments = await db.comment.count({
      where: { photo: { authorId: userId } },
    })

    // Followers count (people following me)
    const followerCount = await db.follow.count({
      where: { followingId: userId },
    })

    // Following count (people I follow)
    const followingCount = await db.follow.count({
      where: { followerId: userId },
    })

    // Views last 7 days (grouped by day)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const recentViews = await db.photoView.findMany({
      where: {
        photo: { authorId: userId },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    })

    // Group by day
    const dayMap: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().split("T")[0]
      dayMap[key] = 0
    }
    for (const v of recentViews) {
      const key = v.createdAt.toISOString().split("T")[0]
      if (key in dayMap) dayMap[key]++
    }

    const viewsLast7Days = Object.entries(dayMap).map(([date, count]) => ({
      date,
      count,
      label: new Date(date).toLocaleDateString("en", { weekday: "short" }),
    }))

    // Top photos by views
    const topPhotos = await db.photo.findMany({
      where: { authorId: userId },
      orderBy: { views: { _count: "desc" } },
      take: 5,
      include: {
        _count: { select: { likes: true, comments: true, views: true } },
      },
    })

    return NextResponse.json({
      photoCount,
      totalViews,
      totalLikes,
      totalComments,
      followerCount,
      followingCount,
      viewsLast7Days,
      topPhotos: topPhotos.map((p) => ({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl,
        views: p._count.views,
        likes: p._count.likes,
        comments: p._count.comments,
      })),
    })
  } catch (err) {
    console.error("[dashboard] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

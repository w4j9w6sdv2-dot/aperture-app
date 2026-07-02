import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/dashboard — current user's stats
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      )
    }

    const userId = currentUser.id

    const [
      totalPhotos,
      totalViewsAgg,
      totalLikesReceivedAgg,
      totalCommentsReceivedAgg,
      totalFollowers,
      totalFollowing,
      photos,
    ] = await Promise.all([
      db.photo.count({ where: { authorId: userId } }),
      db.photoView.aggregate({
        where: { photo: { authorId: userId } },
        _count: { id: true },
      }),
      db.like.aggregate({
        where: { photo: { authorId: userId } },
        _count: { id: true },
      }),
      db.comment.aggregate({
        where: { photo: { authorId: userId } },
        _count: { id: true },
      }),
      db.follow.count({ where: { followingId: userId } }),
      db.follow.count({ where: { followerId: userId } }),
      db.photo.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { likes: true, comments: true, views: true, savedIn: true },
          },
        },
      }),
    ])

    // Aggregate views by day for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const recentViewsRaw = await db.photoView.findMany({
      where: {
        photo: { authorId: userId },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    })

    // Bucket by day (YYYY-MM-DD)
    const dayBuckets: Record<string, number> = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      dayBuckets[key] = 0
    }
    for (const v of recentViewsRaw) {
      const key = v.createdAt.toISOString().slice(0, 10)
      if (key in dayBuckets) {
        dayBuckets[key]++
      }
    }
    const viewsLast7Days = Object.entries(dayBuckets).map(([date, count]) => ({
      date,
      count,
    }))

    // Top photos by view count
    const topPhotos = photos
      .map((p) => ({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        viewCount: p._count.views,
        saveCount: p._count.savedIn,
        pulseScore: p.pulseScore,
      }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)

    return NextResponse.json({
      totalPhotos,
      totalViews: totalViewsAgg._count.id,
      totalLikes: totalLikesReceivedAgg._count.id,
      totalComments: totalCommentsReceivedAgg._count.id,
      totalFollowers,
      totalFollowing,
      viewsLast7Days,
      topPhotos,
    })
  } catch (err) {
    console.error("[dashboard] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    )
  }
}

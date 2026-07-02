import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ user: null })
    }

    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            photos: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ user: null })
    }

    // Count followers/following directly via the Follow table — the
    // User.followers / User.following relation names in the Prisma schema
    // are inverted from the conventional meaning, so we avoid using them
    // for counts.
    const [followerCount, followingCount] = await Promise.all([
      db.follow.count({ where: { followingId: currentUser.id } }),
      db.follow.count({ where: { followerId: currentUser.id } }),
    ])

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        photoCount: user._count.photos,
        followerCount,
        followingCount,
      },
    })
  } catch (err) {
    console.error("[me] error", err)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}

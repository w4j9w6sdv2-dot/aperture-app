import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()

    const user = await db.user.findUnique({
      where: { id },
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
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Count followers (people who follow THIS user) and following (people THIS
    // user follows) directly via the Follow table — clearer than relying on
    // the inverted-by-convention `User.followers` / `User.following` relation
    // names defined in the Prisma schema.
    const [followerCount, followingCount, isFollowingRow] = await Promise.all([
      db.follow.count({ where: { followingId: id } }),
      db.follow.count({ where: { followerId: id } }),
      currentUser
        ? db.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUser.id,
                followingId: id,
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ])

    return NextResponse.json({
      id: user.id,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      photoCount: user._count.photos,
      followerCount,
      followingCount,
      isFollowing: !!isFollowingRow,
      isMe: currentUser?.id === user.id,
    })
  } catch (err) {
    console.error("[user] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}

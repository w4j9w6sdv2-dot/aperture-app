import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        bio: currentUser.bio,
        avatarUrl: currentUser.avatarUrl,
        createdAt: currentUser.createdAt,
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

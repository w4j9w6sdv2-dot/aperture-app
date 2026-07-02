import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/user/preferences
 * Returns the current user's content preferences (isAdult, showAdultContent).
 *
 * PATCH /api/user/preferences
 * Body: { showAdultContent?: boolean, isAdult?: boolean }
 * Updates the user's content preferences.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { isAdult: true, showAdultContent: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (err) {
    console.error("[user/preferences GET] error", err)
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data: { showAdultContent?: boolean; isAdult?: boolean } = {}

    if (typeof body.showAdultContent === "boolean") {
      data.showAdultContent = body.showAdultContent
      // Enabling showAdultContent implies the user declares they are 18+
      if (body.showAdultContent === true) {
        data.isAdult = true
      }
    }
    if (typeof body.isAdult === "boolean") {
      data.isAdult = body.isAdult
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data,
      select: { isAdult: true, showAdultContent: true },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error("[user/preferences PATCH] error", err)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}

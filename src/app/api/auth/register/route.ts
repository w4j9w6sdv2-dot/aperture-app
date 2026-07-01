import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { username, email, password } = parsed.data
    const normalizedEmail = email.toLowerCase()

    const existing = await db.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username }],
      },
    })

    if (existing) {
      if (existing.email === normalizedEmail) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: {
        username,
        email: normalizedEmail,
        passwordHash,
      },
    })

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
    })
  } catch (err) {
    console.error("[register] error", err)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

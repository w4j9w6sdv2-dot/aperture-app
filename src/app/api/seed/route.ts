import { NextResponse } from "next/server"
import { runSeed } from "@/../scripts/seed-data"

// NOTE: This route triggers a database re-seed. It is intentionally
// permissive (no auth) for the demo so anyone previewing the app can
// quickly restore demo content.
export async function POST() {
  try {
    const summary = await runSeed()
    return NextResponse.json({ success: true, ...summary })
  } catch (err) {
    console.error("[seed] error", err)
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    )
  }
}

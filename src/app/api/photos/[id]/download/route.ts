import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/photos/[id]/download?size=original|large|medium|small
 *
 * Returns the photo image directly with Content-Disposition: attachment
 * so the browser downloads it.
 *
 * For non-original sizes, we request a resized version from the source
 * URL by appending URL params (works for Unsplash and many CDNs).
 * For sources that don't support resizing, the original is returned.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params
    const { searchParams } = new URL(req.url)
    const size = (searchParams.get("size") || "original").toLowerCase()

    if (!["original", "large", "medium", "small"].includes(size)) {
      return NextResponse.json(
        { error: "Invalid size. Use: original, large, medium, small" },
        { status: 400 }
      )
    }

    const photo = await db.photo.findUnique({
      where: { id: photoId },
      select: { id: true, title: true, imageUrl: true },
    })

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // For Unsplash URLs we can append width/quality params.
    // For other URLs we just fetch the original.
    let downloadUrl = photo.imageUrl
    if (size !== "original" && photo.imageUrl.includes("images.unsplash.com")) {
      const widths: Record<string, number> = { large: 1200, medium: 800, small: 400 }
      const w = widths[size]
      const sep = photo.imageUrl.includes("?") ? "&" : "?"
      downloadUrl = `${photo.imageUrl}${sep}w=${w}&q=80`
    }

    // Fetch image bytes
    const imgRes = await fetch(downloadUrl, { redirect: "follow" })
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch source image: ${imgRes.status}` },
        { status: 502 }
      )
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer())

    // Detect content type
    let contentType = imgRes.headers.get("content-type") || "image/jpeg"
    if (!contentType.startsWith("image/")) contentType = "image/jpeg"

    // Build a safe filename
    const safeTitle = photo.title
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 60) || "aperture_photo"
    const ext = contentType.split("/")[1]?.split(";")[0] || "jpg"
    const filename = `${safeTitle}_${size}.${ext}`

    // Return as attachment
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (err) {
    console.error("[download] error", err)
    return NextResponse.json(
      { error: "Failed to download photo" },
      { status: 500 }
    )
  }
}

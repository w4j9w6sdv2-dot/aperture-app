import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import sharp from "sharp"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/photos/[id]/download?size=original|large|medium|small
 *
 * Returns the photo image directly with Content-Disposition: attachment
 * so the browser downloads it. For non-original sizes, the image is
 * resized on-the-fly via sharp.
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

    // Fetch original image bytes
    const imgRes = await fetch(photo.imageUrl)
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch source image" },
        { status: 502 }
      )
    }
    const originalBuffer = Buffer.from(await imgRes.arrayBuffer())

    // Resize if needed
    let outputBuffer: Buffer
    let contentType = "image/jpeg"

    if (size === "original") {
      outputBuffer = originalBuffer
      // Detect content type from buffer
      if (originalBuffer[0] === 0x89 && originalBuffer[1] === 0x50) contentType = "image/png"
      else if (originalBuffer[0] === 0x47 && originalBuffer[1] === 0x49) contentType = "image/gif"
      else if (originalBuffer[0] === 0x52 && originalBuffer[1] === 0x49 && originalBuffer[2] === 0x46 && originalBuffer[3] === 0x46) contentType = "image/webp"
    } else {
      const widths: Record<string, number> = { large: 1200, medium: 800, small: 400 }
      const targetWidth = widths[size]
      outputBuffer = await sharp(originalBuffer)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .jpeg({ quality: 90, progressive: true })
        .toBuffer()
      contentType = "image/jpeg"
    }

    // Build a safe filename
    const safeTitle = photo.title
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 60) || "aperture_photo"
    const ext = contentType.split("/")[1]
    const filename = `${safeTitle}_${size}.${ext}`

    // Return as attachment
    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(outputBuffer.length),
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

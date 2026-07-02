"use client"

import { useState } from "react"
import { Download, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

interface DownloadButtonProps {
  photoId: string
  photoTitle: string
  imageUrl: string
}

type SizeKey = "original" | "large" | "medium" | "small"

function buildUrlForSize(originalUrl: string, size: SizeKey): string {
  if (size === "original") return originalUrl
  const widths: Record<SizeKey, number> = { original: 0, large: 1200, medium: 800, small: 400 }
  const w = widths[size]
  if (originalUrl.includes("images.unsplash.com")) {
    const sep = originalUrl.includes("?") ? "&" : "?"
    return `${originalUrl}${sep}w=${w}&q=80`
  }
  return originalUrl
}

async function triggerDownload(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
  } catch {
    window.open(url, "_blank")
  }
}

export function DownloadButton({ photoId: _photoId, photoTitle, imageUrl }: DownloadButtonProps) {
  const t = useT()
  const [downloading, setDownloading] = useState<SizeKey | null>(null)

  const handleDownload = async (size: SizeKey) => {
    setDownloading(size)
    try {
      const url = buildUrlForSize(imageUrl, size)
      const safeTitle = photoTitle
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 60) || "aperture_photo"
      const urlPath = new URL(url).pathname
      const ext = urlPath.split(".").pop()?.split("?")[0] || "jpg"
      const filename = `${safeTitle}_${size}.${ext}`
      await triggerDownload(url, filename)
      toast.success(t("photo.downloadStarted"))
    } catch {
      toast.error(t("photo.downloadError"))
    } finally {
      setTimeout(() => setDownloading(null), 1500)
    }
  }

  const sizes: { key: SizeKey; label: string; desc: string }[] = [
    { key: "original", label: t("photo.downloadOriginal"), desc: t("photo.downloadOriginalDesc") },
    { key: "large", label: t("photo.downloadLarge"), desc: t("photo.downloadLargeDesc") },
    { key: "medium", label: t("photo.downloadMedium"), desc: t("photo.downloadMediumDesc") },
    { key: "small", label: t("photo.downloadSmall"), desc: t("photo.downloadSmallDesc") },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-border/60 hover:border-[#E60023]/60 hover:text-[#E60023] rounded-full"
          disabled={downloading !== null}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{t("photo.download")}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t("photo.download")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sizes.map(({ key, label, desc }) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleDownload(key)}
            className="flex flex-col items-start gap-0.5 cursor-pointer"
            disabled={downloading !== null}
          >
            <span className="text-sm font-medium flex items-center gap-2">
              {downloading === key && <Loader2 className="h-3 w-3 animate-spin" />}
              {label}
            </span>
            <span className="text-[11px] text-muted-foreground">{desc}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

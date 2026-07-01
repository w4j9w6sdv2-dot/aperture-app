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
}

type SizeKey = "original" | "large" | "medium" | "small"

export function DownloadButton({ photoId, photoTitle }: DownloadButtonProps) {
  const t = useT()
  const [downloading, setDownloading] = useState<SizeKey | null>(null)

  const handleDownload = async (size: SizeKey) => {
    setDownloading(size)
    try {
      const url = `/api/photos/${photoId}/download?size=${size}`
      // Use a hidden anchor trick to trigger download
      const a = document.createElement("a")
      a.href = url
      a.download = "" // let server set the filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success(t("photo.downloadStarted"))
    } catch (err) {
      console.error(err)
      toast.error(t("photo.downloadError"))
    } finally {
      // Reset loading state after a short delay
      setTimeout(() => setDownloading(null), 1500)
    }
  }

  const sizes: { key: SizeKey; label: string; fullLabel: string }[] = [
    { key: "original", label: t("photo.downloadOriginal"), fullLabel: t("photo.downloadOriginalFull", { width: "", height: "" }).replace(" ()", "") },
    { key: "large", label: t("photo.downloadLarge"), fullLabel: t("photo.downloadLargeFull") },
    { key: "medium", label: t("photo.downloadMedium"), fullLabel: t("photo.downloadMediumFull") },
    { key: "small", label: t("photo.downloadSmall"), fullLabel: t("photo.downloadSmallFull") },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-border/60 hover:border-[#E60023]/60 hover:text-[#E60023]"
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
        {sizes.map(({ key, label, fullLabel }) => (
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
            <span className="text-[11px] text-muted-foreground">{fullLabel}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

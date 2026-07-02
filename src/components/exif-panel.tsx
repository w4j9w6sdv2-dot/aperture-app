"use client"

import { Camera, Aperture, CircleDot, Clock, Sun, Calendar, Focus } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { PhotoExif } from "@/lib/api"
import { useT } from "@/lib/i18n"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface ExifPanelProps {
  exif: PhotoExif | null | undefined
  className?: string
}

interface Row {
  icon: typeof Camera
  label: string
  value: string | null | undefined
}

export function ExifPanel({ exif, className }: ExifPanelProps) {
  const t = useT()

  if (!exif) {
    return (
      <Card className={cn("p-4 bg-muted/30 border-border/60", className)}>
        <div className="flex items-center gap-2 mb-1">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{t("exif.title")}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{t("exif.noExif")}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">{t("exif.noExifDesc")}</p>
      </Card>
    )
  }

  const rows: Row[] = [
    { icon: Camera, label: t("exif.camera"), value: exif.camera },
    { icon: Aperture, label: t("exif.lens"), value: exif.lens },
    { icon: Focus, label: t("exif.focalLength"), value: exif.focalLength },
    { icon: CircleDot, label: t("exif.aperture"), value: exif.aperture ? `f/${exif.aperture}` : null },
    { icon: Clock, label: t("exif.shutterSpeed"), value: exif.shutterSpeed },
    { icon: Sun, label: t("exif.iso"), value: exif.iso ? `ISO ${exif.iso}` : null },
    { icon: Calendar, label: t("exif.takenAt"), value: exif.takenAt ? formatDate(exif.takenAt) : null },
  ]

  const hasAny = rows.some((r) => r.value)

  if (!hasAny) {
    return (
      <Card className={cn("p-4 bg-muted/30 border-border/60", className)}>
        <div className="flex items-center gap-2 mb-1">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{t("exif.title")}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{t("exif.noExif")}</p>
      </Card>
    )
  }

  return (
    <Card className={cn("p-4 bg-muted/30 border-border/60", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Camera className="h-4 w-4 text-rose-500" />
        <h3 className="text-sm font-semibold">{t("exif.title")}</h3>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {rows.map((row) => {
          const Icon = row.icon
          return (
            <div key={row.label} className="flex items-center gap-2 min-w-0">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">
                  {row.label}
                </dt>
                <dd className="text-xs font-medium truncate leading-tight">
                  {row.value ?? <span className="text-muted-foreground/60">—</span>}
                </dd>
              </div>
            </div>
          )
        })}
      </dl>
    </Card>
  )
}

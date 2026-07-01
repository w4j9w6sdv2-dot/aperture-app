"use client"

import { Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Badge as BadgeType } from "@/lib/api"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface BadgeDisplayProps {
  badges: BadgeType[] | undefined
  className?: string
  variant?: "full" | "compact"
}

const ICON_MAP: Record<string, string> = {
  // Map common icon names → emoji fallbacks. The actual `icon` stored on the
  // Badge model is a freeform string; we render the literal text/icon as
  // fallback when no match.
  star: "⭐",
  trophy: "🏆",
  sparkles: "✨",
  heart: "❤️",
  camera: "📷",
  award: "🏅",
  crown: "👑",
  zap: "⚡",
  fire: "🔥",
  rocket: "🚀",
}

export function BadgeDisplay({ badges, className, variant = "full" }: BadgeDisplayProps) {
  const t = useT()

  if (!badges || badges.length === 0) {
    if (variant === "compact") return null
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <Award className="h-3.5 w-3.5" />
        <span>{t("profile.noBadges")}</span>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map((b) => {
        const iconChar = ICON_MAP[b.icon] ?? b.icon ?? "🏅"
        return (
          <Badge
            key={b.id}
            variant="outline"
            className="gap-1 bg-amber-50/60 border-amber-200 text-amber-800"
            title={b.name}
          >
            <span className="text-xs leading-none">{iconChar}</span>
            {variant === "full" && <span className="text-[11px] font-medium">{b.name}</span>}
          </Badge>
        )
      })}
    </div>
  )
}

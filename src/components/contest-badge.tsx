"use client"

import { Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface ContestBadgeProps {
  contestTitle?: string
  contestId?: string
  contestTheme?: string
  className?: string
  variant?: "default" | "compact"
}

export function ContestBadge({
  contestTitle,
  contestId,
  contestTheme,
  className,
  variant = "default",
}: ContestBadgeProps) {
  const t = useT()
  const setView = useAppStore((s) => s.setView)

  if (!contestTitle && !contestId) return null

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (contestId) setView({ name: "contest", contestId })
      }}
      className={cn("inline-flex", className)}
      title={`${t("photo.contestEntry")}: ${contestTitle ?? contestTheme ?? ""}`}
    >
      <Badge
        variant="secondary"
        className={cn(
          "gap-1 bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 transition-colors",
          variant === "compact" && "px-1.5 py-0"
        )}
      >
        <Trophy className={cn(variant === "compact" ? "h-2.5 w-2.5" : "h-3 w-3")} />
        {variant === "default" && (
          <span className="text-[10px] font-medium uppercase tracking-wide line-clamp-1">
            {contestTitle ?? t("photo.contestEntry")}
          </span>
        )}
      </Badge>
    </button>
  )
}

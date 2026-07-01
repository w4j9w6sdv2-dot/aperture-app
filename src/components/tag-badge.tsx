"use client"

import { Hash } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"

interface TagBadgeProps {
  name: string
  variant?: "default" | "outline" | "secondary"
  className?: string
  showHash?: boolean
}

export function TagBadge({
  name,
  variant = "outline",
  className,
  showHash = false,
}: TagBadgeProps) {
  const setView = useAppStore((s) => s.setView)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setView({ name: "tag", tagName: name })
      }}
      className="inline-flex"
    >
      <Badge
        variant={variant}
        className={cn(
          "cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground",
          className
        )}
      >
        {showHash && <Hash className="h-3 w-3 mr-0.5" />}
        {name}
      </Badge>
    </button>
  )
}

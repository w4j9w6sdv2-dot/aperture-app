"use client"

import { cn } from "@/lib/utils"

/**
 * Aperture logo — Pinterest-inspired style.
 * A red rounded square with a white "A" (for Aperture) inside,
 * plus the wordmark next to it (hidden on small screens).
 */
export function Logo({
  size = "md",
  showWordmark = true,
  className,
}: {
  size?: "sm" | "md" | "lg"
  showWordmark?: boolean
  className?: string
}) {
  const sizes = {
    sm: { box: "h-6 w-6 rounded-md", letter: "text-sm font-bold", word: "text-base" },
    md: { box: "h-7 w-7 rounded-md", letter: "text-base font-bold", word: "text-xl" },
    lg: { box: "h-20 w-20 rounded-2xl", letter: "text-4xl font-bold", word: "text-4xl" },
  }
  const s = sizes[size]

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          s.box,
          "flex items-center justify-center shrink-0 shadow-lg shadow-red-900/30",
          "bg-[#E60023] text-white"
        )}
        aria-hidden="true"
      >
        <span className={s.letter}>A</span>
      </span>
      {showWordmark && (
        <span className={cn(s.word, "font-bold tracking-tight")}>Aperture</span>
      )}
    </span>
  )
}

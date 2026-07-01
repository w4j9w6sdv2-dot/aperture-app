"use client"

import { Heart } from "lucide-react"
import { motion } from "framer-motion"
import { cn, formatCount } from "@/lib/utils"
import { useToggleLike, useCurrentUser } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"

interface LikeButtonProps {
  photoId: string
  liked: boolean
  count: number
  size?: "sm" | "md" | "lg"
  showCount?: boolean
  className?: string
}

export function LikeButton({
  photoId,
  liked,
  count,
  size = "md",
  showCount = true,
  className,
}: LikeButtonProps) {
  const toggle = useToggleLike()
  const { data: currentUser } = useCurrentUser()
  const openAuth = useAppStore((s) => s.openAuth)

  const sizeCls =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUser) {
      openAuth("login")
      toast.info("Sign in to like photos")
      return
    }
    toggle.mutate({ photoId })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={liked ? "Unlike photo" : "Like photo"}
      aria-pressed={liked}
      className={cn(
        "group inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
        liked
          ? "text-rose-500"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <motion.span
        whileTap={{ scale: 0.8 }}
        animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        className="inline-flex"
      >
        <Heart
          className={cn(sizeCls, liked && "fill-current")}
        />
      </motion.span>
      {showCount && (
        <span className="tabular-nums">{formatCount(count)}</span>
      )}
    </button>
  )
}

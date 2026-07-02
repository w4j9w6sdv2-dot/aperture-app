"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatCount } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

interface LikeButtonProps {
  photoId: string
  liked: boolean
  count: number
  size?: "sm" | "md"
  showCount?: boolean
}

export function LikeButton({
  photoId,
  liked,
  count,
  size = "sm",
  showCount = false,
}: LikeButtonProps) {
  const t = useT()
  const { data: session } = useSession()
  const qc = useQueryClient()

  const toggle = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/photos/${photoId}/like`, { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{ liked: boolean; likeCount: number }>
    },
    onMutate: async () => {
      // Optimistic update on the photo detail query
      await qc.cancelQueries({ queryKey: ["photo", photoId] })
      const previous = qc.getQueryData<{ likedByMe: boolean; likeCount: number }>(["photo", photoId])
      if (previous) {
        qc.setQueryData(["photo", photoId], {
          ...previous,
          likedByMe: !previous.likedByMe,
          likeCount: previous.likedByMe ? previous.likeCount - 1 : previous.likeCount + 1,
        })
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(["photo", photoId], ctx.previous)
      }
      toast.error(t("common.error"))
    },
    onSuccess: (data) => {
      // Also invalidate the feed query so cards update
      qc.invalidateQueries({ queryKey: ["photos", "feed"] })
      if (data.liked) {
        toast.success(t("toast.likeAdded"))
      } else {
        toast.success(t("toast.likeRemoved"))
      }
    },
  })

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!session?.user) {
      toast.error(t("auth.loginTitle"))
      return
    }
    toggle.mutate()
  }

  const isMd = size === "md"
  const iconSize = isMd ? "h-5 w-5" : "h-3.5 w-3.5"

  return (
    <button
      onClick={handleClick}
      disabled={toggle.isPending}
      className={cn(
        "inline-flex items-center gap-1.5 transition-colors disabled:opacity-50",
        isMd ? "text-sm" : "text-xs",
        liked ? "text-[#E60023]" : "text-muted-foreground hover:text-[#E60023]"
      )}
      aria-label={liked ? t("photo.liked") : t("photo.like")}
    >
      {toggle.isPending ? (
        <Loader2 className={cn(iconSize, "animate-spin")} />
      ) : (
        <Heart className={cn(iconSize, liked && "fill-current")} />
      )}
      {showCount && (
        <span className="tabular-nums">{formatCount(count)}</span>
      )}
    </button>
  )
}

"use client"

import { useOptimistic } from "react"
import { UserPlus, UserCheck } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useFollow, useCurrentUser } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function FollowButton({
  userId,
  isFollowing,
  variant = "default",
  size = "default",
  className,
}: FollowButtonProps) {
  const follow = useFollow()
  const { data: currentUser } = useCurrentUser()
  const openAuth = useAppStore((s) => s.openAuth)

  // useOptimistic lets us render the in-flight toggle immediately while
  // the server confirms the new state — without managing local state in
  // a useEffect (which the React compiler warns against).
  const [optimisticFollowing, setOptimisticFollowing] = useOptimistic(
    isFollowing,
    (_prev, next: boolean) => next
  )

  if (currentUser?.id === userId) return null

  const handleClick = () => {
    if (!currentUser) {
      openAuth("login")
      toast.info("Sign in to follow users")
      return
    }
    const next = !optimisticFollowing
    setOptimisticFollowing(next)
    follow.mutate(
      { followingId: userId },
      {
        onSuccess: (data) => {
          toast.success(data.following ? "Followed" : "Unfollowed")
        },
        onError: (err) => {
          toast.error(err.message)
        },
      }
    )
  }

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className={cn("inline-flex", className)}
    >
      <Button
        onClick={handleClick}
        variant={optimisticFollowing ? "secondary" : variant}
        size={size}
        disabled={follow.isPending}
        className={cn(
          !optimisticFollowing &&
            "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 hover:border-rose-700",
          optimisticFollowing && "text-muted-foreground",
          "gap-1.5"
        )}
      >
        {optimisticFollowing ? (
          <>
            <UserCheck className="h-4 w-4" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Follow
          </>
        )}
      </Button>
    </motion.div>
  )
}

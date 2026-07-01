"use client"

import { Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatRelativeTime, initialsFromName } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import { useCurrentUser, useDeleteComment } from "@/lib/api"
import type { Comment } from "@/lib/api"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

interface CommentItemProps {
  comment: Comment
  photoId: string
}

export function CommentItem({ comment, photoId }: CommentItemProps) {
  const setView = useAppStore((s) => s.setView)
  const { data: currentUser } = useCurrentUser()
  const del = useDeleteComment()
  const t = useT()

  const isMine = currentUser?.id === comment.author.id

  const handleDelete = () => {
    del.mutate(
      { commentId: comment.id, photoId },
      {
        onSuccess: () => toast.success(t("toast.commentDeleted")),
        onError: (err) => toast.error(err.message),
      }
    )
  }

  return (
    <div className="flex gap-3 group">
      <button
        onClick={() => setView({ name: "profile", userId: comment.author.id })}
        className="shrink-0"
      >
        <Avatar className="h-8 w-8 ring-1 ring-border">
          {comment.author.avatarUrl ? (
            <AvatarImage src={comment.author.avatarUrl} alt={comment.author.username} />
          ) : null}
          <AvatarFallback className="text-xs bg-muted">
            {initialsFromName(comment.author.username)}
          </AvatarFallback>
        </Avatar>
      </button>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setView({ name: "profile", userId: comment.author.id })}
            className="text-sm font-medium hover:text-rose-400 transition-colors"
          >
            {comment.author.username}
          </button>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {isMine && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
              aria-label={t("photo.deleteComment")}
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-500" />
            </Button>
          )}
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
          {comment.body}
        </p>
      </div>
    </div>
  )
}

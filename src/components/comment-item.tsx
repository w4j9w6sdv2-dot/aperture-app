"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { initialsFromName, formatRelativeTime } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

export interface Comment {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    username: string
    avatarUrl?: string | null
  }
}

interface CommentItemProps {
  comment: Comment
  photoId: string
  onAuthorClick?: (userId: string) => void
}

export function CommentItem({ comment, photoId, onAuthorClick }: CommentItemProps) {
  const t = useT()
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [deleting, setDeleting] = useState(false)

  const isOwn = session?.user?.id === comment.author.id

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onMutate: () => {
      setDeleting(true)
    },
    onSuccess: () => {
      // Update the photo detail query to remove the comment
      qc.setQueryData<{ comments: Comment[]; commentCount: number } | undefined>(
        ["photo", photoId],
        (old) => {
          if (!old) return old
          return {
            ...old,
            comments: old.comments.filter((c) => c.id !== comment.id),
            commentCount: Math.max(0, old.commentCount - 1),
          }
        }
      )
      qc.invalidateQueries({ queryKey: ["photos", "feed"] })
      toast.success(t("toast.commentDeleted"))
      setDeleting(false)
    },
    onError: () => {
      toast.error(t("common.error"))
      setDeleting(false)
    },
  })

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteMutation.mutate()
  }

  return (
    <div className="flex gap-2.5 group">
      <button
        onClick={() => onAuthorClick?.(comment.author.id)}
        className="shrink-0"
      >
        <Avatar className="h-7 w-7 ring-1 ring-border">
          {comment.author.avatarUrl ? (
            <AvatarImage src={comment.author.avatarUrl} alt={comment.author.username} />
          ) : null}
          <AvatarFallback className="text-[10px] bg-muted">
            {initialsFromName(comment.author.username)}
          </AvatarFallback>
        </Avatar>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onAuthorClick?.(comment.author.id)}
            className="text-xs font-semibold hover:text-[#E60023] transition-colors"
          >
            {comment.author.username}
          </button>
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-[#E60023] disabled:opacity-50"
              aria-label={t("photo.deleteComment")}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words mt-0.5">
          {comment.body}
        </p>
      </div>
    </div>
  )
}

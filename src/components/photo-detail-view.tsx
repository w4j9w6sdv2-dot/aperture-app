"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, MessageCircle, Eye, Send, Loader2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { LikeButton } from "@/components/like-button"
import { CommentItem, type Comment } from "@/components/comment-item"
import { useSession } from "next-auth/react"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"
import { initialsFromName, formatCount, formatRelativeTime } from "@/lib/utils"

interface PhotoDetailViewProps {
  photoId: string
  onBack: () => void
  onAuthorClick?: (userId: string) => void
  onAuthOpen?: (mode: "login" | "signup") => void
}

interface PhotoDetail {
  id: string
  title: string
  description?: string | null
  imageUrl: string
  createdAt: string
  author: {
    id: string
    username: string
    avatarUrl?: string | null
    bio?: string | null
  }
  tags: string[]
  category?: {
    id: string
    name: string
    slug: string
    icon: string | null
    isAdult: boolean
  } | null
  isAdult?: boolean
  comments: Comment[]
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

export function PhotoDetailView({ photoId, onBack, onAuthorClick, onAuthOpen }: PhotoDetailViewProps) {
  const t = useT()
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [commentBody, setCommentBody] = useState("")

  const { data: photo, isLoading, error } = useQuery<PhotoDetail>({
    queryKey: ["photo", photoId],
    queryFn: async () => {
      const res = await fetch(`/api/photos/${photoId}`)
      if (res.status === 403) {
        const data = await res.json()
        throw new Error(data.error || "NSFW")
      }
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    retry: false,
  })

  const addComment = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/photos/${photoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody.trim() }),
      })
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<Comment>
    },
    onSuccess: (newComment) => {
      qc.setQueryData<PhotoDetail | undefined>(["photo", photoId], (old) => {
        if (!old) return old
        return {
          ...old,
          comments: [...old.comments, newComment],
          commentCount: old.commentCount + 1,
        }
      })
      setCommentBody("")
      toast.success(t("toast.commentAdded"))
    },
    onError: () => {
      toast.error(t("common.error"))
    },
  })

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user) {
      onAuthOpen?.("login")
      return
    }
    if (!commentBody.trim()) return
    addComment.mutate()
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <Skeleton className="h-8 w-20 mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!photo) {
    // Check if it's an NSFW error
    const isNsfwError = error?.message?.includes("adult") || error?.message?.includes("18")
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        {isNsfwError ? (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-[#E60023]/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-7 w-7 text-[#E60023]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("nsfw.title")}</h3>
            <p className="text-sm text-muted-foreground mb-6">{t("nsfw.description")}</p>
            <Button onClick={onBack} variant="outline" className="mr-2">
              {t("photo.back")}
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">{t("common.error")}</p>
            <Button onClick={onBack} variant="outline" className="mt-4">
              {t("photo.back")}
            </Button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t("photo.back")}</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Image */}
        <div className="rounded-xl overflow-hidden bg-muted/40 border border-border/60">
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="w-full h-auto object-contain max-h-[70vh]"
          />
        </div>

        {/* Side panel: info + comments */}
        <div className="flex flex-col gap-4">
          {/* Author */}
          <div className="flex items-center gap-3">
            <button onClick={() => onAuthorClick?.(photo.author.id)}>
              <Avatar className="h-10 w-10 ring-1 ring-border">
                {photo.author.avatarUrl ? (
                  <AvatarImage src={photo.author.avatarUrl} alt={photo.author.username} />
                ) : null}
                <AvatarFallback className="text-xs bg-muted">
                  {initialsFromName(photo.author.username)}
                </AvatarFallback>
              </Avatar>
            </button>
            <div>
              <button
                onClick={() => onAuthorClick?.(photo.author.id)}
                className="text-sm font-semibold hover:text-[#E60023] transition-colors block"
              >
                {photo.author.username}
              </button>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(photo.createdAt)}
              </span>
            </div>
          </div>

          {/* Title + description */}
          <div>
            <h1 className="text-xl font-bold mb-1">{photo.title}</h1>
            {photo.description && (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                {photo.description}
              </p>
            )}
          </div>

          {/* Tags */}
          {photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {photo.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm py-2 border-y border-border/60">
            <LikeButton
              photoId={photo.id}
              liked={photo.likedByMe}
              count={photo.likeCount}
              size="md"
              showCount
            />
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="tabular-nums">{formatCount(photo.commentCount)}</span>
            </span>
          </div>

          {/* Comments */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">
              {t("photo.comments")} ({photo.commentCount})
            </h3>

            {/* Comment form */}
            <form onSubmit={handleSubmitComment} className="flex gap-2 items-end">
              <Textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder={session?.user ? t("photo.addComment") : t("auth.loginTitle")}
                rows={2}
                maxLength={1000}
                disabled={!session?.user}
                className="flex-1 resize-none text-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!commentBody.trim() || addComment.isPending}
                className="bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023] h-9 w-9 p-0"
              >
                {addComment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            {/* Comments list */}
            {photo.comments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                {t("photo.noComments")}
              </p>
            ) : (
              <div className="space-y-3">
                {photo.comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    photoId={photo.id}
                    onAuthorClick={onAuthorClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

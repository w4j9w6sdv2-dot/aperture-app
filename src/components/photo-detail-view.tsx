"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Trash2,
  Eye,
  MessageCircle,
  Loader2,
  Send,
  MapPin,
  Flame,
  Bookmark,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { LikeButton } from "@/components/like-button"
import { DownloadButton } from "@/components/download-button"
import { TagBadge } from "@/components/tag-badge"
import { CommentItem } from "@/components/comment-item"
import { FollowButton } from "@/components/follow-button"
import { EmptyState } from "@/components/empty-state"
import { ExifPanel } from "@/components/exif-panel"
import { LicenseBadge, licenseDescription } from "@/components/license-badge"
import { SaveButton } from "@/components/save-button"
import { ContestBadge } from "@/components/contest-badge"
import {
  usePhoto,
  useCreateComment,
  useDeletePhoto,
  useCurrentUser,
  useTrackView,
} from "@/lib/api"
import { useAppStore } from "@/lib/store"
import {
  formatDate,
  formatRelativeTime,
  formatCount,
  initialsFromName,
} from "@/lib/utils"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

export function PhotoDetailView() {
  const photoId = useAppStore((s) =>
    s.view.name === "photo" ? s.view.photoId : null
  )
  const goBack = useAppStore((s) => s.goBack)
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const { data: currentUser } = useCurrentUser()

  const { data: photo, isLoading, isError } = usePhoto(photoId)
  const [commentBody, setCommentBody] = useState("")
  const createComment = useCreateComment()
  const deletePhoto = useDeletePhoto()
  const trackView = useTrackView()
  const t = useT()

  const commentListRef = useRef<HTMLDivElement>(null)
  const trackedRef = useRef<string | null>(null)

  // Increment view count once per photo load
  useEffect(() => {
    if (!photoId || trackedRef.current === photoId) return
    trackedRef.current = photoId
    trackView.mutate({ photoId })
  }, [photoId, trackView])

  useEffect(() => {
    // scroll to top on photo change
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [photoId])

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> {t("photo.back")}
        </Button>
        <Skeleton className="w-full aspect-[3/2]" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  if (isError || !photo) {
    return (
      <EmptyState
        icon={ArrowLeft}
        title={t("photo.notFound")}
        description={t("photo.notFoundDesc")}
        action={
          <Button onClick={() => setView({ name: "home" })}>{t("photo.backToHome")}</Button>
        }
      />
    )
  }

  const isAuthor = currentUser?.id === photo.author.id

  const onComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      openAuth("login")
      return
    }
    const body = commentBody.trim()
    if (!body) return
    createComment.mutate(
      { photoId: photo.id, body },
      {
        onSuccess: () => {
          setCommentBody("")
          toast.success(t("toast.commentAdded"))
          // scroll to bottom of comments
          setTimeout(() => {
            commentListRef.current?.scrollTo({
              top: commentListRef.current.scrollHeight,
              behavior: "smooth",
            })
          }, 100)
        },
        onError: (err) => toast.error(err.message),
      }
    )
  }

  const onDeletePhoto = () => {
    if (!confirm(t("photo.deleteConfirm"))) return
    deletePhoto.mutate(photo.id, {
      onSuccess: () => {
        toast.success(t("toast.photoDeleted"))
        setView({ name: "home" })
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-4"
    >
      <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> {t("photo.back")}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* Image */}
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden bg-black/60 border border-border">
            <img
              src={photo.imageUrl}
              alt={photo.title}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>

          {/* Mobile-only author row */}
          <div className="lg:hidden flex items-center gap-3">
            <button
              onClick={() => setView({ name: "profile", userId: photo.author.id })}
            >
              <Avatar className="h-10 w-10 ring-1 ring-border">
                {photo.author.avatarUrl ? (
                  <AvatarImage src={photo.author.avatarUrl} alt={photo.author.username} />
                ) : null}
                <AvatarFallback className="bg-muted">
                  {initialsFromName(photo.author.username)}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="min-w-0 flex-1">
              <button
                onClick={() => setView({ name: "profile", userId: photo.author.id })}
                className="text-sm font-medium hover:text-rose-400 transition-colors block truncate"
              >
                {photo.author.username}
              </button>
              <p className="text-xs text-muted-foreground">
                {t("photo.publishedAt", { time: formatRelativeTime(photo.createdAt) })}
              </p>
            </div>
            {!isAuthor && (
              <FollowButton
                userId={photo.author.id}
                isFollowing={!!photo.author.isFollowing}
                size="sm"
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Title + actions */}
          <div>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h1 className="text-2xl font-bold leading-tight flex-1">{photo.title}</h1>
              <div className="flex items-center gap-1.5 shrink-0">
                <SaveButton
                  photoId={photo.id}
                  savedByMe={photo.savedByMe}
                  variant="ghost"
                  size="icon"
                />
                {isAuthor && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-rose-500"
                    onClick={onDeletePhoto}
                    aria-label={t("photo.deletePhotoAria")}
                    disabled={deletePhoto.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <p className="text-xs text-muted-foreground">
                {formatDate(photo.createdAt)}
              </p>
              {photo.isEditorPick && (
                <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                  <Trophy className="h-3 w-3" />
                  <span className="text-[10px] uppercase tracking-wide">{t("photo.editorPick")}</span>
                </Badge>
              )}
              {photo.license && (
                <LicenseBadge license={photo.license} />
              )}
            </div>
          </div>

          {/* Desktop author */}
          <div className="hidden lg:flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
            <button
              onClick={() => setView({ name: "profile", userId: photo.author.id })}
            >
              <Avatar className="h-10 w-10 ring-1 ring-border">
                {photo.author.avatarUrl ? (
                  <AvatarImage src={photo.author.avatarUrl} alt={photo.author.username} />
                ) : null}
                <AvatarFallback className="bg-muted">
                  {initialsFromName(photo.author.username)}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="min-w-0 flex-1">
              <button
                onClick={() => setView({ name: "profile", userId: photo.author.id })}
                className="text-sm font-medium hover:text-rose-400 transition-colors block truncate"
              >
                {photo.author.username}
              </button>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(photo.createdAt)}
              </p>
            </div>
            {!isAuthor && (
              <FollowButton
                userId={photo.author.id}
                isFollowing={!!photo.author.isFollowing}
                size="sm"
              />
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <LikeButton
              photoId={photo.id}
              liked={photo.likedByMe}
              count={photo.likeCount}
              size="md"
            />
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="tabular-nums">
                {formatCount(photo.commentCount)}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="tabular-nums">
                {formatCount(photo.viewCount ?? 0)}
              </span>
            </span>
            {typeof photo.pulseScore === "number" && photo.pulseScore > 0 && (
              <span className="flex items-center gap-1.5 text-rose-500">
                <Flame className="h-4 w-4" />
                <span className="tabular-nums font-medium">
                  {formatCount(photo.pulseScore)}
                </span>
              </span>
            )}
            <div className="ml-auto">
              <DownloadButton photoId={photo.id} photoTitle={photo.title} imageUrl={photo.imageUrl} />
            </div>
          </div>

          {/* Description */}
          {photo.description && (
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {photo.description}
            </p>
          )}

          {/* Category & Location */}
          {(photo.category || photo.location) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {photo.category && (
                <button
                  onClick={() =>
                    setView({ name: "category", categorySlug: photo.category!.slug })
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60 border border-border/60 hover:bg-muted transition-colors"
                >
                  {photo.category.icon && <span>{photo.category.icon}</span>}
                  <span className="font-medium">{photo.category.name}</span>
                </button>
              )}
              {photo.location && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {photo.location}
                </Badge>
              )}
            </div>
          )}

          {/* Tags */}
          {photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {photo.tags.map((tag) => (
                <TagBadge key={tag} name={tag} showHash />
              ))}
            </div>
          )}

          {/* Contest entries */}
          {photo.contestEntries && photo.contestEntries.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("photo.contestEntry")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {photo.contestEntries.map((ce) => (
                  <ContestBadge
                    key={ce.id}
                    contestId={ce.contest.id}
                    contestTitle={ce.contest.title}
                    contestTheme={ce.contest.theme}
                  />
                ))}
              </div>
            </div>
          )}

          {/* EXIF */}
          <ExifPanel exif={photo.exif} />

          {/* License description */}
          {photo.license && (
            <div className="text-[11px] text-muted-foreground px-2 py-1.5 rounded-md bg-muted/40 border border-border/40">
              {licenseDescription(photo.license, t)}
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-border/60 pt-4">
            <h3 className="text-sm font-semibold mb-3">
              {t("photo.comments")} {photo.commentCount > 0 && `(${photo.commentCount})`}
            </h3>

            <form onSubmit={onComment} className="flex gap-2 mb-4">
              <Textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder={
                  currentUser
                    ? t("photo.addComment")
                    : t("photo.signInToComment")
                }
                rows={2}
                maxLength={1000}
                className="resize-none bg-muted/60"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    onComment(e)
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={createComment.isPending || !commentBody.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
                aria-label={t("photo.postCommentAria")}
              >
                {createComment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            <div
              ref={commentListRef}
              className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin pr-1"
            >
              {photo.comments && photo.comments.length > 0 ? (
                photo.comments.map((c) => (
                  <CommentItem key={c.id} comment={c} photoId={photo.id} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t("photo.noComments")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Re-export Bookmark to satisfy import graph
export { Bookmark }

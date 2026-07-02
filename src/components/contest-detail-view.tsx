"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ArrowLeft, Trophy, Calendar, Users, Vote, Heart, Check, ImageOff, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"
import { initialsFromName, formatCount, formatRelativeTime } from "@/lib/utils"

interface ContestDetailViewProps {
  contestId: string
  onBack: () => void
  onPhotoClick?: (photoId: string) => void
  onAuthOpen?: (mode: "login" | "signup") => void
}

interface Entry {
  id: string
  photoId: string
  userId: string
  username: string
  createdAt: string
  voteCount: number
  votedByMe: boolean
  photo: {
    id: string
    title: string
    imageUrl: string
    createdAt: string
    author: { id: string; username: string; avatarUrl?: string | null }
    tags: string[]
    likeCount: number
    commentCount: number
  }
}

interface ContestDetail {
  id: string
  title: string
  description: string
  theme: string
  prize: string | null
  startsAt: string
  endsAt: string
  status: string
  bannerUrl: string | null
  entryCount: number
  voteCount: number
  myVoteEntryId: string | null
  myEntryId: string | null
  myEntryPhotoId: string | null
  entries: Entry[]
}

function getDaysLeft(endsAt: string): number {
  const diff = new Date(endsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function ContestDetailView({ contestId, onBack, onPhotoClick, onAuthOpen }: ContestDetailViewProps) {
  const t = useT()
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [pickOpen, setPickOpen] = useState(false)

  const { data: contest, isLoading } = useQuery<ContestDetail>({
    queryKey: ["contest", contestId],
    queryFn: async () => {
      const res = await fetch(`/api/contests/${contestId}`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const voteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/contests/${contestId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contest", contestId] })
      qc.invalidateQueries({ queryKey: ["contests"] })
      toast.success(t("contest.voted"))
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("common.error")),
  })

  const enterMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const res = await fetch(`/api/contests/${contestId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contest", contestId] })
      qc.invalidateQueries({ queryKey: ["contests"] })
      setPickOpen(false)
      toast.success(t("contest.entered"))
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("common.error")),
  })

  const handleVote = (entryId: string) => {
    if (!session?.user) {
      onAuthOpen?.("login")
      return
    }
    voteMutation.mutate(entryId)
  }

  const handleEnter = () => {
    if (!session?.user) {
      onAuthOpen?.("login")
      return
    }
    setPickOpen(true)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        <Skeleton className="h-8 w-20 mb-6" />
        <Skeleton className="h-48 w-full rounded-xl mb-6" />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("common.error")}</p>
        <Button onClick={onBack} variant="outline" className="mt-4">{t("photo.back")}</Button>
      </div>
    )
  }

  const daysLeft = getDaysLeft(contest.endsAt)
  const hasEntered = !!contest.myEntryId
  const hasVoted = !!contest.myVoteEntryId

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t("photo.back")}</span>
      </button>

      {/* Contest header */}
      <div className="rounded-xl overflow-hidden border border-border/60 bg-card mb-6">
        {contest.bannerUrl && (
          <div className="h-48 sm:h-64 bg-muted overflow-hidden">
            <img src={contest.bannerUrl} alt={contest.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl font-bold">{contest.title}</h1>
            <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E60023]/10 text-[#E60023] text-xs font-medium">
              <Calendar className="h-3 w-3" />
              {daysLeft > 0 ? `${daysLeft} ${t("contest.daysLeft")}` : t("contest.ended")}
            </span>
          </div>
          <p className="text-sm text-[#E60023] font-medium mb-3">{t("contest.theme")}: {contest.theme}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{contest.description}</p>
          {contest.prize && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#E60023]/5 border border-[#E60023]/10 mb-4">
              <Trophy className="h-4 w-4 text-[#E60023] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#E60023]">{t("contest.prize")}</p>
                <p className="text-sm text-foreground/80">{contest.prize}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span className="tabular-nums font-medium text-foreground">{contest.entryCount}</span>
              {t("contest.entries")}
            </span>
            <span className="flex items-center gap-1.5">
              <Vote className="h-4 w-4" />
              <span className="tabular-nums font-medium text-foreground">{contest.voteCount}</span>
              {t("contest.votes")}
            </span>
          </div>

          {/* Enter button */}
          {session?.user && !hasEntered && daysLeft > 0 && (
            <Button
              onClick={handleEnter}
              className="mt-4 bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023] gap-1.5"
            >
              <Trophy className="h-4 w-4" />
              {t("contest.enterPhoto")}
            </Button>
          )}
          {hasEntered && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
              <Check className="h-4 w-4" />
              {t("contest.youEntered")}
            </div>
          )}
        </div>
      </div>

      {/* Entries */}
      <h2 className="text-lg font-semibold mb-4">
        {t("contest.entries")} ({contest.entries.length})
      </h2>

      {contest.entries.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ImageOff className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t("contest.noEntries")}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {contest.entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
              className="group rounded-xl border border-border/60 bg-card overflow-hidden hover:shadow-lg transition-all"
            >
              <div
                onClick={() => onPhotoClick?.(entry.photoId)}
                className="relative cursor-pointer overflow-hidden aspect-[4/3]"
              >
                <img
                  src={entry.photo.imageUrl}
                  alt={entry.photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Vote count badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur text-white text-xs font-medium">
                  <Vote className="h-3 w-3" />
                  {formatCount(entry.voteCount)}
                </div>
              </div>

              <div className="p-3">
                <h3 className="text-sm font-semibold truncate mb-1">{entry.photo.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-5 w-5">
                    {entry.photo.author.avatarUrl ? (
                      <AvatarImage src={entry.photo.author.avatarUrl} alt={entry.username} />
                    ) : null}
                    <AvatarFallback className="text-[8px] bg-muted">
                      {initialsFromName(entry.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{entry.username}</span>
                </div>

                {/* Vote button */}
                {daysLeft > 0 && (
                  <Button
                    onClick={() => handleVote(entry.id)}
                    disabled={voteMutation.isPending}
                    variant={entry.votedByMe ? "default" : "outline"}
                    size="sm"
                    className={`w-full gap-1.5 ${
                      entry.votedByMe
                        ? "bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023]"
                        : "border-border/60 hover:border-[#E60023]/60 hover:text-[#E60023]"
                    }`}
                  >
                    {voteMutation.isPending && voteMutation.variables === entry.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : entry.votedByMe ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Vote className="h-3.5 w-3.5" />
                    )}
                    {entry.votedByMe ? t("contest.voted") : t("contest.vote")}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Photo picker dialog (to enter contest) */}
      <PhotoPickerDialog
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        onPick={(photoId) => enterMutation.mutate(photoId)}
        loading={enterMutation.isPending}
        contestId={contestId}
      />
    </div>
  )
}

// Inline photo picker — fetches current user's photos
function PhotoPickerDialog({
  open,
  onClose,
  onPick,
  loading,
  contestId,
}: {
  open: boolean
  onClose: () => void
  onPick: (photoId: string) => void
  loading: boolean
  contestId: string
}) {
  const t = useT()
  const { data: session } = useSession()

  const { data, isLoading } = useQuery({
    queryKey: ["my-photos-for-contest", contestId],
    queryFn: async () => {
      if (!session?.user?.id) return { items: [] }
      const res = await fetch(`/api/photos?authorId=${session.user.id}&take=50`)
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{ items: { id: string; title: string; imageUrl: string }[] }>
    },
    enabled: open && !!session?.user?.id,
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("contest.selectPhoto")}</DialogTitle>
          <DialogDescription>{t("contest.selectPhotoDesc")}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{t("contest.noPhotos")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {data.items.map((photo) => (
              <button
                key={photo.id}
                onClick={() => onPick(photo.id)}
                disabled={loading}
                className="group relative aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-[#E60023] transition-all disabled:opacity-50"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-1.5">
                  <p className="text-[10px] text-white opacity-0 group-hover:opacity-100 line-clamp-1">{photo.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

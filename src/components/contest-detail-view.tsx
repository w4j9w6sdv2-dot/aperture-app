"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Trophy,
  CalendarClock,
  Users,
  Vote,
  Heart,
  ImageOff,
  Loader2,
  ChevronDown,
  Crown,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import {
  useContest,
  useVoteContest,
  useEnterContest,
  usePhotosInfinite,
  useCurrentUser,
} from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { formatCount, formatRelativeTime, initialsFromName, cn } from "@/lib/utils"
import { toast } from "sonner"

function timeLeft(endsAt: string, t: (k: string, p?: Record<string, string>) => string): string {
  const end = new Date(endsAt).getTime()
  const now = Date.now()
  const diff = Math.max(0, end - now)
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  if (days > 0) return `${days} ${t("contest.days")} ${hours} ${t("contest.hours")}`
  if (hours > 0) return `${hours} ${t("contest.hours")}`
  return t("contest.ended2")
}

export function ContestDetailView() {
  const t = useT()
  const contestId = useAppStore((s) =>
    s.view.name === "contest" ? s.view.contestId : null
  )
  const goBack = useAppStore((s) => s.goBack)
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const { data: currentUser } = useCurrentUser()

  const { data: contest, isLoading, isError } = useContest(contestId)
  const voteMut = useVoteContest()
  const enterMut = useEnterContest()

  const [enterOpen, setEnterOpen] = useState(false)

  // Fetch current user's photos to populate the "enter photo" picker
  const myPhotosQuery = usePhotosInfinite(
    { authorId: currentUser?.id, sort: "newest" as const },
    !!currentUser && enterOpen
  )
  const myPhotos = myPhotosQuery.data?.pages.flatMap((p) => p.items) ?? []

  const handleVote = (entryId: string) => {
    if (!currentUser) {
      openAuth("login")
      return
    }
    if (!contest) return
    voteMut.mutate(
      { contestId: contest.id, entryId },
      {
        onSuccess: (data) => {
          if (data.voted && data.changed) {
            toast.success(t("toast.voteChanged"))
          } else if (data.voted) {
            toast.success(t("toast.voted"))
          } else {
            toast.success(t("toast.voteRemoved"))
          }
        },
        onError: (e) => toast.error(e.message),
      }
    )
  }

  const handleEnter = (photoId: string) => {
    if (!contest) return
    enterMut.mutate(
      { contestId: contest.id, photoId },
      {
        onSuccess: () => {
          toast.success(t("toast.enteredContest"))
          setEnterOpen(false)
        },
        onError: (e) => toast.error(e.message),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> {t("photo.back")}
        </Button>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !contest) {
    return (
      <EmptyState
        icon={ImageOff}
        title={t("photo.notFound")}
        description={t("photo.notFoundDesc")}
        action={
          <Button onClick={() => setView({ name: "contests" })}>{t("photo.back")}</Button>
        }
      />
    )
  }

  const ended = new Date(contest.endsAt).getTime() < Date.now()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> {t("photo.back")}
      </Button>

      {/* Contest header */}
      <Card className="overflow-hidden p-0 border-amber-200/60">
        {contest.bannerUrl && (
          <div className="relative h-48 sm:h-64 overflow-hidden bg-muted">
            <img
              src={contest.bannerUrl}
              alt={contest.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-amber-500/90 text-white border-amber-500 hover:bg-amber-600">
                  <Trophy className="h-3 w-3 mr-1" />
                  {ended ? t("contest.ended") : t("contest.active")}
                </Badge>
                <Badge variant="outline" className="bg-black/40 text-white border-white/20 backdrop-blur-sm">
                  <CalendarClock className="h-3 w-3 mr-1" />
                  {ended ? t("contest.ended2") : `${t("contest.endsIn")} ${timeLeft(contest.endsAt, t)}`}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
                {contest.title}
              </h1>
            </div>
          </div>
        )}
        <div className="p-5 sm:p-6 space-y-4">
          {!contest.bannerUrl && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-amber-500/90 text-white border-amber-500 hover:bg-amber-600">
                <Trophy className="h-3 w-3 mr-1" />
                {ended ? t("contest.ended") : t("contest.active")}
              </Badge>
              <Badge variant="outline">
                <CalendarClock className="h-3 w-3 mr-1" />
                {ended ? t("contest.ended2") : `${t("contest.endsIn")} ${timeLeft(contest.endsAt, t)}`}
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-bold ml-auto">{contest.title}</h1>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50/50 border border-amber-200/60">
              <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t("contest.theme")}
                </p>
                <p className="text-sm font-semibold truncate">{contest.theme}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border/60">
              <Users className="h-5 w-5 text-foreground/60 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t("contest.entries")}
                </p>
                <p className="text-sm font-semibold tabular-nums">{formatCount(contest.entryCount)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border/60">
              <Vote className="h-5 w-5 text-foreground/60 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t("contest.votes")}
                </p>
                <p className="text-sm font-semibold tabular-nums">{formatCount(contest.voteCount)}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{contest.description}</p>

          {contest.prize && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200">
              <Crown className="h-4 w-4 text-rose-600 shrink-0" />
              <p className="text-sm">
                <span className="font-semibold text-rose-700">{t("contest.prize")}: </span>
                <span className="text-rose-700/90">{contest.prize}</span>
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <Button
              onClick={() => {
                if (!currentUser) {
                  openAuth("login")
                  return
                }
                setEnterOpen(true)
              }}
              disabled={ended}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
            >
              <Trophy className="h-4 w-4" />
              {t("contest.enterPhoto")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {contest.hasVoted
                ? t("contest.yourVote")
                : currentUser
                  ? t("contest.vote")
                  : t("contest.loginToVote")}
            </p>
          </div>
        </div>
      </Card>

      {/* Entries */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t("contest.entries")} ({contest.entries.length})
        </h2>

        {contest.entries.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            title={t("contest.noEntries")}
            description={t("contest.noEntriesDesc")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contest.entries.map((entry, i) => {
              const rank = i + 1
              const medalColors =
                rank === 1
                  ? "bg-amber-500 text-white"
                  : rank === 2
                    ? "bg-slate-400 text-white"
                    : rank === 3
                      ? "bg-orange-700 text-white"
                      : "bg-muted text-muted-foreground"
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
                >
                  <Card
                    className={cn(
                      "overflow-hidden p-0 border-border/60 hover:border-amber-300/60 hover:shadow-lg transition-all rounded-xl cursor-pointer",
                      entry.votedByMe && "ring-2 ring-rose-400/60"
                    )}
                    onClick={() => setView({ name: "photo", photoId: entry.photo.id })}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={entry.photo.imageUrl}
                        alt={entry.photo.title}
                        loading="lazy"
                        className="w-full h-44 sm:h-48 object-cover"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold shadow-md",
                            medalColors
                          )}
                        >
                          {rank}
                        </span>
                      </div>
                      {entry.votedByMe && (
                        <Badge className="absolute top-2 right-2 bg-rose-600 text-white border-rose-600">
                          <Vote className="h-3 w-3 mr-1" />
                          {t("contest.voted")}
                        </Badge>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-sm font-semibold text-white line-clamp-1">
                          {entry.photo.title}
                        </p>
                        <p className="text-xs text-white/70 flex items-center gap-1.5 mt-0.5">
                          <Heart className="h-3 w-3" />
                          {formatCount(entry.photo.likeCount)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 space-y-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setView({ name: "profile", userId: entry.user.id })
                        }}
                        className="flex items-center gap-2 min-w-0 w-full group/author"
                      >
                        <Avatar className="h-6 w-6 ring-1 ring-border">
                          {entry.user.avatarUrl ? (
                            <AvatarImage src={entry.user.avatarUrl} alt={entry.user.username} />
                          ) : null}
                          <AvatarFallback className="text-[10px] bg-muted">
                            {initialsFromName(entry.user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium truncate group-hover/author:text-rose-500 transition-colors">
                          {entry.user.username}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {formatRelativeTime(entry.createdAt)}
                        </span>
                      </button>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVote(entry.id)
                          }}
                          disabled={voteMut.isPending || ended}
                          variant={entry.votedByMe ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "flex-1 gap-1.5",
                            entry.votedByMe
                              ? "bg-rose-600 hover:bg-rose-700 text-white"
                              : "hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                          )}
                        >
                          {voteMut.isPending && voteMut.variables?.entryId === entry.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Vote className="h-3.5 w-3.5" />
                          )}
                          <span className="tabular-nums">{formatCount(entry.voteCount)}</span>
                          {entry.votedByMe ? t("contest.voted") : t("contest.vote")}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Enter photo dialog */}
      <Dialog open={enterOpen} onOpenChange={(o) => !o && setEnterOpen(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle>{t("contest.enterPhoto")}</DialogTitle>
            <DialogDescription>{contest.title}</DialogDescription>
          </DialogHeader>
          {myPhotosQuery.isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!myPhotosQuery.isLoading && myPhotos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("contest.noPhotosToEnter")}
            </p>
          )}
          {myPhotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {myPhotos.map((p) => {
                const already = contest.entries.some((e) => e.photo.id === p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => handleEnter(p.id)}
                    disabled={already || enterMut.isPending}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 transition-all text-left group",
                      already
                        ? "border-amber-400 cursor-default opacity-80"
                        : "border-transparent hover:border-rose-400 cursor-pointer"
                    )}
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-xs text-white font-medium line-clamp-1">{p.title}</p>
                    </div>
                    {already && (
                      <Badge className="absolute top-1.5 right-1.5 bg-amber-500 text-white border-amber-500">
                        {t("contest.entered")}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// Re-export ChevronDown to satisfy import graph
export { ChevronDown }

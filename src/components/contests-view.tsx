"use client"

import { motion } from "framer-motion"
import { Trophy, CalendarClock, Users, Vote, ArrowRight, ImageOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useContests, useCurrentUser } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { formatDate, formatCount } from "@/lib/utils"

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

export function ContestsView() {
  const t = useT()
  const setView = useAppStore((s) => s.setView)
  const { data: contests, isLoading } = useContests("active")
  const { data: currentUser } = useCurrentUser()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-bold">{t("contest.title")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t("contest.subtitle")}</p>
      </header>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (!contests || contests.length === 0) && (
        <EmptyState
          icon={ImageOff}
          title={t("contest.noContests")}
          description={t("contest.noContestsDesc")}
        />
      )}

      {!isLoading && contests && contests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {contests.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <Card className="overflow-hidden p-0 border-border/60 hover:border-amber-300/60 hover:shadow-lg hover:shadow-amber-500/10 transition-all rounded-xl">
                {c.bannerUrl && (
                  <div className="relative h-40 sm:h-48 overflow-hidden bg-muted">
                    <img
                      src={c.bannerUrl}
                      alt={c.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge className="bg-amber-500/90 text-white border-amber-500 hover:bg-amber-600">
                        <Trophy className="h-3 w-3 mr-1" />
                        {t("contest.active")}
                      </Badge>
                    </div>
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div>
                    <h2 className="text-lg font-bold leading-tight">{c.title}</h2>
                    <p className="text-xs text-amber-700 mt-0.5 font-medium uppercase tracking-wide">
                      {t("contest.theme")}: {c.theme}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{c.description}</p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span className="tabular-nums">{formatCount(c.entryCount)}</span>{" "}
                      {t("contest.entries")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Vote className="h-3.5 w-3.5" />
                      <span className="tabular-nums">{formatCount(c.voteCount)}</span>{" "}
                      {t("contest.votes")}
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {timeLeft(c.endsAt, t)}
                    </span>
                  </div>

                  <Button
                    onClick={() => setView({ name: "contest", contestId: c.id })}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                  >
                    {t("common.viewAll")} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!currentUser && (
        <p className="text-center text-xs text-muted-foreground pt-4">
          {t("contest.loginToEnter")} · {t("contest.loginToVote")}
        </p>
      )}
    </motion.div>
  )
}

"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Trophy, Calendar, Users, Vote, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useT } from "@/lib/i18n"
import { formatRelativeTime } from "@/lib/utils"

interface ContestsViewProps {
  onContestClick?: (contestId: string) => void
}

interface Contest {
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
}

function getDaysLeft(endsAt: string): number {
  const diff = new Date(endsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function ContestsView({ onContestClick }: ContestsViewProps) {
  const t = useT()

  const { data, isLoading } = useQuery({
    queryKey: ["contests"],
    queryFn: async () => {
      const res = await fetch("/api/contests")
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{ items: Contest[] }>
    },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[#E60023]/10 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-[#E60023]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("contest.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("contest.subtitle")}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Trophy className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t("contest.empty")}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.items.map((contest, i) => {
            const daysLeft = getDaysLeft(contest.endsAt)
            return (
              <motion.button
                key={contest.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                onClick={() => onContestClick?.(contest.id)}
                className="group text-left rounded-xl border border-border/60 bg-card hover:border-black/20 hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Banner */}
                <div className="relative h-40 bg-muted overflow-hidden">
                  {contest.bannerUrl ? (
                    <img
                      src={contest.bannerUrl}
                      alt={contest.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[#E60023] text-white text-xs font-medium">
                    <Calendar className="h-3 w-3" />
                    {daysLeft > 0 ? `${daysLeft} ${t("contest.daysLeft")}` : t("contest.ending")}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-base mb-1 group-hover:text-[#E60023] transition-colors">
                    {contest.title}
                  </h3>
                  <p className="text-xs text-[#E60023] font-medium mb-2">{t("contest.theme")}: {contest.theme}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{contest.description}</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span className="tabular-nums font-medium text-foreground">{contest.entryCount}</span>
                      {t("contest.entries")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Vote className="h-3.5 w-3.5" />
                      <span className="tabular-nums font-medium text-foreground">{contest.voteCount}</span>
                      {t("contest.votes")}
                    </span>
                    <span className="ml-auto flex items-center gap-0.5 text-[#E60023] font-medium">
                      {t("contest.view")}
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}

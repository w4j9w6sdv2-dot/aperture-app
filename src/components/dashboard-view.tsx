"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Image as ImageIcon, Eye, Heart, MessageCircle, Users, TrendingUp, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useT } from "@/lib/i18n"
import { formatCount, formatRelativeTime } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

interface DashboardStats {
  photoCount: number
  totalViews: number
  totalLikes: number
  totalComments: number
  followerCount: number
  followingCount: number
  viewsLast7Days: { date: string; count: number; label: string }[]
  topPhotos: {
    id: string
    title: string
    imageUrl: string
    views: number
    likes: number
    comments: number
  }[]
}

interface DashboardViewProps {
  onPhotoClick?: (photoId: string) => void
}

export function DashboardView({ onPhotoClick }: DashboardViewProps) {
  const t = useT()

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("common.error")}</p>
      </div>
    )
  }

  const statCards = [
    { icon: ImageIcon, label: t("dashboard.photos"), value: stats.photoCount, color: "#E60023" },
    { icon: Eye, label: t("dashboard.views"), value: stats.totalViews, color: "#0084FF" },
    { icon: Heart, label: t("dashboard.likes"), value: stats.totalLikes, color: "#FF0066" },
    { icon: Users, label: t("dashboard.followers"), value: stats.followerCount, color: "#FF8A00" },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[#E60023]/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-[#E60023]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="p-4 rounded-xl border border-border/60 bg-card"
          >
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center mb-2"
              style={{ backgroundColor: `${card.color}15` }}
            >
              <card.icon className="h-4 w-4" style={{ color: card.color }} />
            </div>
            <p className="text-2xl font-bold tabular-nums">{formatCount(card.value)}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Views chart */}
      <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">{t("dashboard.views7days")}</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.viewsLast7Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="count" fill="#E60023" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top photos */}
      <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-6">
        <h2 className="text-sm font-semibold mb-4">{t("dashboard.topPhotos")}</h2>
        {stats.topPhotos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noPhotos")}</p>
        ) : (
          <div className="space-y-2">
            {stats.topPhotos.map((photo, i) => (
              <div
                key={photo.id}
                onClick={() => onPhotoClick?.(photo.id)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <span className="text-sm font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="h-12 w-12 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{photo.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {formatCount(photo.views)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" />
                      {formatCount(photo.likes)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageCircle className="h-3 w-3" />
                      {formatCount(photo.comments)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

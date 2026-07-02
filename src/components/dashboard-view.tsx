"use client"

import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Image as ImageIcon,
  Eye,
  Heart,
  MessageCircle,
  Users,
  UserPlus,
  TrendingUp,
  Flame,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useDashboard, useCurrentUser } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { formatCount } from "@/lib/utils"

interface StatCardProps {
  icon: typeof ImageIcon
  label: string
  value: number
  accent: string
  delay?: number
}

function StatCard({ icon: Icon, label, value, accent, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
    >
      <Card className="p-4 sm:p-5 bg-card border-border/60 hover:shadow-md transition-shadow rounded-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums mt-1">
              {formatCount(value)}
            </p>
          </div>
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function DashboardView() {
  const t = useT()
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const { data: currentUser } = useCurrentUser()
  const { data: stats, isLoading } = useDashboard()

  if (!currentUser) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title={t("dashboard.loginRequired")}
        description={t("dashboard.loginRequiredDesc")}
        action={
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={() => openAuth("login")}
          >
            {t("auth.loginSubmit")}
          </Button>
        }
      />
    )
  }

  if (isLoading || !stats) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  const chartData = stats.viewsLast7Days.map((d) => ({
    date: d.date.slice(5), // MM-DD
    views: d.count,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-rose-500" />
          <h1 className="text-2xl sm:text-3xl font-bold">{t("dashboard.title")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={ImageIcon}
          label={t("dashboard.totalPhotos")}
          value={stats.totalPhotos}
          accent="bg-rose-50 text-rose-600"
          delay={0}
        />
        <StatCard
          icon={Eye}
          label={t("dashboard.totalViews")}
          value={stats.totalViews}
          accent="bg-blue-50 text-blue-600"
          delay={0.05}
        />
        <StatCard
          icon={Heart}
          label={t("dashboard.totalLikes")}
          value={stats.totalLikes}
          accent="bg-pink-50 text-pink-600"
          delay={0.1}
        />
        <StatCard
          icon={MessageCircle}
          label={t("dashboard.totalComments")}
          value={stats.totalComments}
          accent="bg-purple-50 text-purple-600"
          delay={0.15}
        />
        <StatCard
          icon={Users}
          label={t("dashboard.followers")}
          value={stats.totalFollowers}
          accent="bg-emerald-50 text-emerald-600"
          delay={0.2}
        />
        <StatCard
          icon={UserPlus}
          label={t("dashboard.following")}
          value={stats.totalFollowing}
          accent="bg-amber-50 text-amber-600"
          delay={0.25}
        />
      </div>

      {/* 7-day views chart */}
      <Card className="p-5 sm:p-6 bg-card border-border/60 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-rose-500" />
          <h2 className="text-base font-semibold">{t("dashboard.views7days")}</h2>
        </div>
        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 90%)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(240 4% 46%)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(240 4% 46%)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(240 5% 96%)" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(240 5% 90%)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(240 4% 46%)" }}
              />
              <Bar
                dataKey="views"
                fill="#E60023"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Top photos */}
      <Card className="p-5 sm:p-6 bg-card border-border/60 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-rose-500" />
          <h2 className="text-base font-semibold">{t("dashboard.topPhotos")}</h2>
        </div>

        {stats.topPhotos.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title={t("dashboard.noPhotos")}
            description={t("dashboard.noPhotosDesc")}
            action={
              <Button
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => setView({ name: "upload" })}
              >
                {t("feed.uploadAction")}
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {stats.topPhotos.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                onClick={() => setView({ name: "photo", photoId: p.id })}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors text-left group"
              >
                <span className="h-7 w-7 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="h-14 w-14 rounded-md overflow-hidden bg-muted shrink-0">
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-rose-500 transition-colors">
                    {p.title}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {formatCount(p.viewCount)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" />
                      {formatCount(p.likeCount)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageCircle className="h-3 w-3" />
                      {formatCount(p.commentCount)}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t("dashboard.pulse")}
                  </p>
                  <p className="text-sm font-bold text-rose-600 tabular-nums">
                    {formatCount(p.pulseScore)}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

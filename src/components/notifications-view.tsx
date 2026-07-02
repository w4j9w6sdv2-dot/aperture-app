"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Heart, MessageCircle, UserPlus, Star, Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useT } from "@/lib/i18n"
import { formatRelativeTime } from "@/lib/utils"

interface NotificationItem {
  id: string
  type: string
  actorId: string | null
  photoId: string | null
  text: string
  read: boolean
  createdAt: string
}

interface NotificationsViewProps {
  onPhotoClick?: (photoId: string) => void
}

const iconMap: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  editor_pick: Star,
}

const colorMap: Record<string, string> = {
  like: "#FF0066",
  comment: "#0084FF",
  follow: "#FF8A00",
  editor_pick: "#E60023",
}

export function NotificationsView({ onPhotoClick }: NotificationsViewProps) {
  const t = useT()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{ items: NotificationItem[]; unreadCount: number }>
    },
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", { method: "PATCH" })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const handleMarkAll = () => {
    markAllRead.mutate()
  }

  const handleClick = (notif: NotificationItem) => {
    if (notif.photoId) {
      onPhotoClick?.(notif.photoId)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#E60023]/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-[#E60023]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("notification.title")}</h1>
            {data && data.unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {data.unreadCount} {t("notification.unread")}
              </p>
            )}
          </div>
        </div>
        {data && data.unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={markAllRead.isPending}
            className="gap-1.5 rounded-full"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{t("notification.markAllRead")}</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t("notification.empty")}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {data.items.map((notif, i) => {
            const Icon = iconMap[notif.type] ?? Bell
            const color = colorMap[notif.type] ?? "#999"
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                onClick={() => handleClick(notif)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  notif.read
                    ? "border-border/40 bg-transparent"
                    : "border-[#E60023]/20 bg-[#E60023]/5 hover:bg-[#E60023]/10"
                } ${notif.photoId ? "hover:border-[#E60023]/40" : ""}`}
              >
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                    {notif.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(notif.createdAt)}
                  </p>
                </div>
                {!notif.read && (
                  <span className="h-2 w-2 rounded-full bg-[#E60023] shrink-0" />
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

"use client"

import { motion } from "framer-motion"
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Trophy,
  Award,
  CheckCheck,
  ImageOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useNotifications, useMarkNotificationsRead, useCurrentUser } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { formatRelativeTime, initialsFromName, cn } from "@/lib/utils"
import { toast } from "sonner"

function notifIcon(type: string) {
  switch (type) {
    case "like":
      return { Icon: Heart, cls: "bg-rose-50 text-rose-500" }
    case "comment":
      return { Icon: MessageCircle, cls: "bg-blue-50 text-blue-600" }
    case "follow":
      return { Icon: UserPlus, cls: "bg-emerald-50 text-emerald-600" }
    case "contest":
      return { Icon: Trophy, cls: "bg-amber-50 text-amber-600" }
    case "badge":
      return { Icon: Award, cls: "bg-purple-50 text-purple-600" }
    default:
      return { Icon: Bell, cls: "bg-muted text-muted-foreground" }
  }
}

export function NotificationsView() {
  const t = useT()
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const { data: currentUser } = useCurrentUser()
  const { data: notifications, isLoading } = useNotifications()
  const markRead = useMarkNotificationsRead()

  if (!currentUser) {
    return (
      <EmptyState
        icon={Bell}
        title={t("notification.title")}
        description={t("notification.subtitle")}
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

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-5"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-rose-500" />
            <h1 className="text-2xl sm:text-3xl font-bold">{t("notification.title")}</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{t("notification.subtitle")}</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={markRead.isPending}
            onClick={() =>
              markRead.mutate(undefined, {
                onSuccess: () => toast.success(t("toast.notificationsRead")),
                onError: (e) => toast.error(e.message),
              })
            }
            className="gap-1.5 shrink-0"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{t("notification.markAllRead")}</span>
          </Button>
        )}
      </header>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && (!notifications || notifications.length === 0) && (
        <EmptyState
          icon={ImageOff}
          title={t("notification.empty")}
          description={t("notification.emptyDesc")}
        />
      )}

      {!isLoading && notifications && notifications.length > 0 && (
        <div className="space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
          {notifications.map((n, i) => {
            const { Icon, cls } = notifIcon(n.type)
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.4) }}
              >
                <Card
                  className={cn(
                    "p-3 sm:p-4 border-border/60 rounded-lg flex items-start gap-3 transition-colors",
                    n.read ? "bg-card" : "bg-rose-50/30 border-rose-100"
                  )}
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                      cls
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {n.actor && (
                        <button
                          onClick={() =>
                            n.actor && setView({ name: "profile", userId: n.actor.id })
                          }
                          className="flex items-center gap-1.5 hover:text-rose-500 transition-colors min-w-0"
                        >
                          <Avatar className="h-5 w-5">
                            {n.actor.avatarUrl ? (
                              <AvatarImage
                                src={n.actor.avatarUrl}
                                alt={n.actor.username}
                              />
                            ) : null}
                            <AvatarFallback className="text-[9px] bg-muted">
                              {initialsFromName(n.actor.username)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate">
                            {n.actor.username}
                          </span>
                        </button>
                      )}
                      <p className="text-sm text-foreground/80 truncate">
                        {n.text}
                      </p>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>

                  {n.photoId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setView({ name: "photo", photoId: n.photoId! })}
                      className="text-xs shrink-0"
                    >
                      {t("dashboard.viewPhoto")}
                    </Button>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

"use client"

import { Home, Compass, Star, Trophy, FolderHeart, LayoutDashboard, Bell, Layers } from "lucide-react"
import { useAppStore, type View } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { useNotifications } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

interface NavItem {
  label: string
  view: View
  icon: typeof Home
  match: (v: View) => boolean
  requiresAuth?: boolean
  badgeKey?: "notifications"
}

export function MainNav() {
  const t = useT()
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const { data: notifications } = useNotifications()
  const unread = useMemo(
    () => notifications?.filter((n) => !n.read).length ?? 0,
    [notifications]
  )

  const items: NavItem[] = [
    {
      label: t("nav.feed"),
      view: { name: "home" },
      icon: Home,
      match: (v) => v.name === "home",
    },
    {
      label: t("nav.explore"),
      view: { name: "home" },
      icon: Compass,
      match: (v) => v.name === "home",
    },
    {
      label: t("nav.editorPicks"),
      view: { name: "editor-picks" },
      icon: Star,
      match: (v) => v.name === "editor-picks",
    },
    {
      label: t("nav.contests"),
      view: { name: "contests" },
      icon: Trophy,
      match: (v) => v.name === "contests" || v.name === "contest",
    },
    {
      label: t("nav.collections"),
      view: { name: "collections" },
      icon: FolderHeart,
      match: (v) => v.name === "collections" || v.name === "collection",
    },
    {
      label: t("nav.dashboard"),
      view: { name: "dashboard" },
      icon: LayoutDashboard,
      match: (v) => v.name === "dashboard",
    },
    {
      label: t("nav.notifications"),
      view: { name: "notifications" },
      icon: Bell,
      match: (v) => v.name === "notifications",
      badgeKey: "notifications",
    },
  ]

  // Drop the duplicate "Explore" entry — both Feed & Explore land on home for now.
  const filtered = items.filter((it, i) => !(it.label === t("nav.explore") && i === 1))

  return (
    <nav
      aria-label="Primary"
      className="sticky top-14 sm:top-16 z-30 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-6">
        <ul className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-thin h-11">
          {filtered.map((item) => {
            const Icon = item.icon
            const active = item.match(view)
            const showBadge = item.badgeKey === "notifications" && unread > 0
            return (
              <li key={item.label} className="shrink-0">
                <button
                  onClick={() => setView(item.view)}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 h-8 rounded-full text-xs sm:text-sm font-medium transition-colors",
                    active
                      ? "bg-[#E60023]/10 text-[#E60023]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

// Re-export Layers to satisfy import graph (unused otherwise)
export { Layers }

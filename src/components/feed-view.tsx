"use client"

import { useMemo, useState } from "react"
import { Flame, Clock, ImageOff, TrendingUp } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PhotoCard, PhotoCardSkeleton } from "@/components/photo-card"
import { EmptyState } from "@/components/empty-state"
import { usePhotosInfinite, useCurrentUser } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function FeedView() {
  const tab = useAppStore((s) => s.homeTab)
  const setTab = useAppStore((s) => s.setHomeTab)
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const { data: currentUser } = useCurrentUser()
  const t = useT()

  // Discover tab supports a sort toggle (newest / popular).
  // Feed tab is always newest (followed users).
  const [discoverSort, setDiscoverSort] = useState<"newest" | "popular">(
    "newest"
  )

  const params = useMemo(
    () => ({
      sort: tab === "discover" ? discoverSort : ("newest" as const),
      followedOnly: tab === "feed",
    }),
    [tab, discoverSort]
  )

  const query = usePhotosInfinite(
    params,
    tab !== "feed" || !!currentUser
  )

  const photos = query.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div className="space-y-6">
      {/* Tabs / sort header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "discover" | "feed")}
        >
          <TabsList>
            <TabsTrigger value="discover">{t("feed.discover")}</TabsTrigger>
            <TabsTrigger value="feed">{t("feed.feed")}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sort toggle for Discover */}
        {tab === "discover" && (
          <div
            role="tablist"
            aria-label="Sort photos"
            className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 p-0.5 text-xs"
          >
            <button
              role="tab"
              aria-selected={discoverSort === "newest"}
              onClick={() => setDiscoverSort("newest")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 transition-colors",
                discoverSort === "newest"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5" /> {t("feed.newest")}
            </button>
            <button
              role="tab"
              aria-selected={discoverSort === "popular"}
              onClick={() => setDiscoverSort("popular")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 transition-colors",
                discoverSort === "popular"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" /> {t("feed.popular")}
            </button>
          </div>
        )}
      </div>

      {/* Feed-specific: requires auth */}
      {tab === "feed" && !currentUser && (
        <EmptyState
          icon={Flame}
          title={t("feed.feedWaiting")}
          description={t("feed.feedWaitingDesc")}
          action={
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => openAuth("login")}
            >
              {t("feed.feedSignin")}
            </Button>
          }
        />
      )}

      {/* Loading skeleton */}
      {query.isLoading && (
        <div className="masonry-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <PhotoCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!query.isLoading && photos.length === 0 && tab === "discover" && (
        <EmptyState
          icon={ImageOff}
          title={t("feed.emptyDiscover")}
          description={t("feed.emptyDiscoverDesc")}
          action={
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() =>
                currentUser
                  ? setView({ name: "upload" })
                  : openAuth("signup")
              }
            >
              {t("feed.uploadAction")}
            </Button>
          }
        />
      )}

      {!query.isLoading &&
        photos.length === 0 &&
        tab === "feed" &&
        currentUser && (
          <EmptyState
            icon={Clock}
            title={t("feed.emptyFeedTitle")}
            description={t("feed.emptyFeedDescAlt")}
            action={
              <Button variant="outline" onClick={() => setTab("discover")}>
                {t("feed.exploreDiscover")}
              </Button>
            }
          />
        )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="masonry-grid">
          {photos.map((p, i) => (
            <PhotoCard key={p.id} photo={p} index={i} />
          ))}
        </div>
      )}

      {/* Load more */}
      {query.hasNextPage && photos.length > 0 && (
        <div className="flex justify-center pt-4 pb-2">
          <Button
            variant="outline"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="min-w-[180px]"
          >
            {query.isFetchingNextPage ? t("common.loading") : t("feed.loadMore")}
          </Button>
        </div>
      )}

      {!query.hasNextPage && photos.length > 0 && (
        <div className="text-center text-xs text-muted-foreground py-6">
          {t("feed.endReached")}
        </div>
      )}
    </div>
  )
}

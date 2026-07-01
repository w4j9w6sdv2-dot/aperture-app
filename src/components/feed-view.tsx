"use client"

import { useMemo, useState } from "react"
import { Flame, Clock, ImageOff, TrendingUp } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PhotoCard, PhotoCardSkeleton } from "@/components/photo-card"
import { EmptyState } from "@/components/empty-state"
import { usePhotosInfinite, useCurrentUser } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function FeedView() {
  const tab = useAppStore((s) => s.homeTab)
  const setTab = useAppStore((s) => s.setHomeTab)
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const { data: currentUser } = useCurrentUser()

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
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="feed">Feed</TabsTrigger>
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
              <Clock className="h-3.5 w-3.5" /> Newest
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
              <TrendingUp className="h-3.5 w-3.5" /> Popular
            </button>
          </div>
        )}
      </div>

      {/* Feed-specific: requires auth */}
      {tab === "feed" && !currentUser && (
        <EmptyState
          icon={Flame}
          title="Your feed is waiting"
          description="Follow photographers to see their latest work here. Sign in to get started."
          action={
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => openAuth("login")}
            >
              Sign in to see your feed
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
          title="No photos yet"
          description="Be the first to share something with the community."
          action={
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() =>
                currentUser
                  ? setView({ name: "upload" })
                  : openAuth("signup")
              }
            >
              Upload a photo
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
            title="Nothing in your feed yet"
            description="Head to Discover and follow some photographers to fill your feed."
            action={
              <Button variant="outline" onClick={() => setTab("discover")}>
                Explore Discover
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
            {query.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      {!query.hasNextPage && photos.length > 0 && (
        <div className="text-center text-xs text-muted-foreground py-6">
          You&apos;ve reached the end.
        </div>
      )}
    </div>
  )
}

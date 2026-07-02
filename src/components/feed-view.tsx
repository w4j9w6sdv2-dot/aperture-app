"use client"

import { useEffect, useRef, useCallback } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Camera, Loader2, Compass } from "lucide-react"
import { PhotoCard, PhotoCardSkeleton, type Photo } from "@/components/photo-card"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n"

interface FeedViewProps {
  onPhotoClick?: (photoId: string) => void
  onAuthorClick?: (userId: string) => void
  onDiscoverClick?: () => void
}

export function FeedView({ onPhotoClick, onAuthorClick, onDiscoverClick }: FeedViewProps) {
  const t = useT()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["photos", "feed"],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const url = pageParam
        ? `/api/photos?cursor=${pageParam}&take=12`
        : "/api/photos?take=12"
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch photos")
      return res.json() as Promise<{ items: Photo[]; nextCursor: string | null }>
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  })

  // Infinite scroll: when sentinel is visible, fetch next page
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetching) {
        fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetching]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleIntersect])

  const photos = data?.pages.flatMap((p) => p.items) ?? []

  // Empty state
  if (!isLoading && photos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-md px-4 py-16 text-center"
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Compass className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">{t("feed.emptyFeed")}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t("feed.emptyFeedDesc")}</p>
        {onDiscoverClick && (
          <Button
            onClick={onDiscoverClick}
            className="bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023] gap-1.5 rounded-full"
          >
            <Compass className="h-4 w-4" />
            {t("feed.discoverMore")}
          </Button>
        )}
      </motion.div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="masonry-grid">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <PhotoCardSkeleton key={i} />)
          : photos.map((photo, i) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={i}
                onClick={() => onPhotoClick?.(photo.id)}
                onAuthorClick={onAuthorClick}
              />
            ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-4">
        {isFetching && (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  )
}

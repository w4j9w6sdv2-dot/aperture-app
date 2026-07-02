"use client"

import { useEffect, useRef, useCallback } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, X, Camera } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PhotoCard, PhotoCardSkeleton, type Photo } from "@/components/photo-card"
import { useT } from "@/lib/i18n"

interface SearchViewProps {
  query: string
  onQueryChange: (q: string) => void
  onPhotoClick?: (photoId: string) => void
  onAuthorClick?: (userId: string) => void
}

export function SearchView({ query, onQueryChange, onPhotoClick, onAuthorClick }: SearchViewProps) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["photos", "search", query],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params = new URLSearchParams({ take: "12", search: query })
      if (pageParam) params.set("cursor", pageParam)
      const res = await fetch(`/api/photos?${params}`)
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{ items: Photo[]; nextCursor: string | null }>
    },
    enabled: query.trim().length > 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  })

  const sentinelRef = useRef<HTMLDivElement>(null)

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
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "200px" })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleIntersect])

  const photos = data?.pages.flatMap((p) => p.items) ?? []
  const hasQuery = query.trim().length > 0

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("search.placeholder")}
            className="pl-9 pr-9 h-12 text-base bg-muted/40 border-border/60 focus-visible:bg-background rounded-full"
          />
          {query && (
            <button
              onClick={() => onQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {!hasQuery ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t("search.placeholder")}</p>
        </motion.div>
      ) : isLoading ? (
        <div className="masonry-grid">
          {Array.from({ length: 6 }).map((_, i) => <PhotoCardSkeleton key={i} />)}
        </div>
      ) : photos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Camera className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{t("search.empty")}</h3>
          <p className="text-sm text-muted-foreground">{t("search.emptyDesc")}</p>
        </motion.div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {t("search.title")} <span className="font-medium text-foreground">"{query}"</span> · {photos.length}
          </p>
          <div className="masonry-grid">
            {photos.map((photo, i) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={i}
                onClick={() => onPhotoClick?.(photo.id)}
                onAuthorClick={onAuthorClick}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-4">
            {isFetching && <div className="h-5 w-5 rounded-full border-2 border-muted border-t-[#E60023] animate-spin" />}
          </div>
        </>
      )}
    </div>
  )
}

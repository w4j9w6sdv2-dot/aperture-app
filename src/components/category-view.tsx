"use client"

import { useEffect, useRef, useCallback } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
import { PhotoCard, PhotoCardSkeleton, type Photo } from "@/components/photo-card"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n"

interface CategoryViewProps {
  slug: string
  onBack: () => void
  onPhotoClick?: (photoId: string) => void
  onAuthorClick?: (userId: string) => void
  onAdultGate?: () => void
}

export function CategoryView({ slug, onBack, onPhotoClick, onAuthorClick, onAdultGate }: CategoryViewProps) {
  const t = useT()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${slug}`)
      if (res.status === 403) {
        return { error: "adult" as const }
      }
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{
        category: { id: string; name: string; slug: string; icon: string | null; isAdult: boolean }
        items: Photo[]
        nextCursor: string | null
      }>
    },
  })

  const isAdultBlocked = catData && "error" in catData && catData.error === "adult"
  const category = catData && !("error" in catData) ? catData.category : null

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["category-photos", slug],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params = new URLSearchParams({ take: "12" })
      if (pageParam) params.set("cursor", pageParam)
      const res = await fetch(`/api/categories/${slug}?${params}`)
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{ items: Photo[]; nextCursor: string | null }>
    },
    enabled: !!category,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  })

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

  // NSFW gate (rendered before any other UI)
  if (isAdultBlocked) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("photo.back")}</span>
        </button>
        <div className="mx-auto w-16 h-16 rounded-full bg-[#E60023]/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-[#E60023]" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t("nsfw.title")}</h3>
        <p className="text-sm text-muted-foreground mb-6">{t("nsfw.description")}</p>
        <Button
          onClick={onAdultGate}
          className="bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023] rounded-full"
        >
          {t("nsfw.enable")}
        </Button>
      </div>
    )
  }

  const photos = data?.pages.flatMap((p) => p.items) ?? (catData && !("error" in catData) ? catData.items : [])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t("photo.back")}</span>
      </button>

      {catLoading ? (
        <div className="h-8 w-40 bg-muted animate-pulse rounded mb-6" />
      ) : category ? (
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {category.name}
            {category.isAdult && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#E60023]/10 text-[#E60023] font-medium border border-[#E60023]/20">
                18+
              </span>
            )}
          </h1>
        </div>
      ) : null}

      {isLoading ? (
        <div className="masonry-grid">
          {Array.from({ length: 8 }).map((_, i) => <PhotoCardSkeleton key={i} />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">{t("feed.emptyDiscover")}</p>
        </div>
      ) : (
        <>
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
            {isFetching && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
        </>
      )}
    </div>
  )
}

"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { SearchX, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PhotoCard, PhotoCardSkeleton } from "@/components/photo-card"
import { EmptyState } from "@/components/empty-state"
import { usePhotosInfinite } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useT } from "@/lib/i18n"

export function SearchView() {
  const query = useAppStore((s) =>
    s.view.name === "search" ? s.view.query : ""
  )
  const goBack = useAppStore((s) => s.goBack)
  const setView = useAppStore((s) => s.setView)
  const t = useT()

  const params = useMemo(
    () => ({ search: query, sort: "newest" as const }),
    [query]
  )
  const photosQuery = usePhotosInfinite(params)
  const photos = photosQuery.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> {t("photo.back")}
      </Button>

      <div>
        <h1 className="text-2xl font-bold">
          {t("search.results")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          for <span className="text-rose-400 font-medium">&quot;{query}&quot;</span> — {t("search.resultsDesc")}
        </p>
      </div>

      {photosQuery.isLoading && (
        <div className="masonry-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <PhotoCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!photosQuery.isLoading && photos.length === 0 && (
        <EmptyState
          icon={SearchX}
          title={t("search.empty")}
          description={t("search.noMatchesDesc", { query })}
          action={
            <Button variant="outline" onClick={() => setView({ name: "home" })}>
              {t("search.backToDiscover")}
            </Button>
          }
        />
      )}

      {photos.length > 0 && (
        <div className="masonry-grid">
          {photos.map((p, i) => (
            <PhotoCard key={p.id} photo={p} index={i} />
          ))}
        </div>
      )}

      {photosQuery.hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => photosQuery.fetchNextPage()}
            disabled={photosQuery.isFetchingNextPage}
          >
            {photosQuery.isFetchingNextPage ? t("common.loading") : t("feed.loadMore")}
          </Button>
        </div>
      )}
    </motion.div>
  )
}

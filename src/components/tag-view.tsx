"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Hash, Flame, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhotoCard, PhotoCardSkeleton } from "@/components/photo-card"
import { EmptyState } from "@/components/empty-state"
import { usePhotosInfinite, usePopularTags } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useState } from "react"
import { TagBadge } from "@/components/tag-badge"
import { useT } from "@/lib/i18n"

export function TagView() {
  const tagName = useAppStore((s) =>
    s.view.name === "tag" ? s.view.tagName : ""
  )
  const goBack = useAppStore((s) => s.goBack)
  const setView = useAppStore((s) => s.setView)
  const [sort, setSort] = useState<"newest" | "popular">("newest")
  const t = useT()

  const params = useMemo(
    () => ({ tag: tagName, sort }),
    [tagName, sort]
  )
  const photosQuery = usePhotosInfinite(params)
  const photos = photosQuery.data?.pages.flatMap((p) => p.items) ?? []

  const { data: popularTags } = usePopularTags()
  const relatedTags = (popularTags ?? [])
    .filter((t) => t.name !== tagName.toLowerCase())
    .slice(0, 12)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> {t("photo.back")}
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-rose-600/20 flex items-center justify-center">
          <Hash className="h-6 w-6 text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{tagName}</h1>
          <p className="text-sm text-muted-foreground">
            {photosQuery.data?.pages[0]?.items.length
              ? t("tag.photosTagged")
              : t("tag.tagLabel")}
          </p>
        </div>
      </div>

      {/* Related tags */}
      {relatedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground self-center mr-1">
            {t("tag.related")}
          </span>
          {relatedTags.map((rt) => (
            <TagBadge key={rt.id} name={rt.name} variant="secondary" />
          ))}
        </div>
      )}

      {/* Sort */}
      <div className="flex items-center justify-between">
        <Tabs value={sort} onValueChange={(v) => setSort(v as "newest" | "popular")}>
          <TabsList>
            <TabsTrigger value="newest" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {t("feed.newest")}
            </TabsTrigger>
            <TabsTrigger value="popular" className="gap-1.5">
              <Flame className="h-3.5 w-3.5" /> {t("feed.popular")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
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
          icon={Hash}
          title={t("tag.empty")}
          description={t("tag.emptyDesc", { tag: tagName })}
          action={
            <Button variant="outline" onClick={() => setView({ name: "home" })}>
              {t("tag.backToDiscover")}
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

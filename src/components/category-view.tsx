"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, Flame, TrendingUp, ImageOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PhotoCard, PhotoCardSkeleton } from "@/components/photo-card"
import { EmptyState } from "@/components/empty-state"
import { useCategoryPhotos, type PhotoSort } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function CategoryView() {
  const slug = useAppStore((s) =>
    s.view.name === "category" ? s.view.categorySlug : null
  )
  const goBack = useAppStore((s) => s.goBack)
  const t = useT()
  const [sort, setSort] = useState<PhotoSort>("newest")

  const query = useCategoryPhotos(slug, sort)
  const photos = query.data?.pages.flatMap((p) => p.items) ?? []
  const category = query.data?.pages[0]?.category

  const sortOptions: { key: PhotoSort; label: string; icon: typeof Clock }[] = useMemo(
    () => [
      { key: "newest", label: t("feed.newest"), icon: Clock },
      { key: "popular", label: t("feed.popular"), icon: Flame },
      { key: "pulse", label: t("photo.pulse"), icon: TrendingUp },
    ],
    [t]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> {t("photo.back")}
      </Button>

      <header className="space-y-2">
        {category && (
          <div className="flex items-center gap-2">
            {category.icon && (
              <span className="text-2xl">{category.icon}</span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold">{category.name}</h1>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{t("category.subtitle")}</p>
      </header>

      {/* Sort tabs */}
      <div
        role="tablist"
        aria-label="Sort photos"
        className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 p-0.5 text-xs"
      >
        {sortOptions.map((opt) => {
          const Icon = opt.icon
          const active = sort === opt.key
          return (
            <button
              key={opt.key}
              role="tab"
              aria-selected={active}
              onClick={() => setSort(opt.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {opt.label}
            </button>
          )
        })}
      </div>

      {query.isLoading && (
        <div className="masonry-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <PhotoCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!query.isLoading && photos.length === 0 && (
        <EmptyState
          icon={ImageOff}
          title={t("category.empty")}
          description={t("category.emptyDesc")}
        />
      )}

      {photos.length > 0 && (
        <div className="masonry-grid">
          {photos.map((p, i) => (
            <PhotoCard key={p.id} photo={p} index={i} />
          ))}
        </div>
      )}

      {query.hasNextPage && photos.length > 0 && (
        <div className="flex justify-center pt-4">
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
    </motion.div>
  )
}

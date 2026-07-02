"use client"

import { motion } from "framer-motion"
import { Star, ImageOff } from "lucide-react"
import { PhotoCard, PhotoCardSkeleton } from "@/components/photo-card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { useEditorPicks } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useT } from "@/lib/i18n"

export function EditorPicksView() {
  const t = useT()
  const setView = useAppStore((s) => s.setView)
  const { data: photos, isLoading } = useEditorPicks()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-500 fill-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-bold">{t("editor.title")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t("editor.subtitle")}</p>
      </header>

      {isLoading && (
        <div className="masonry-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <PhotoCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && (!photos || photos.length === 0) && (
        <EmptyState
          icon={ImageOff}
          title={t("editor.empty")}
          description={t("editor.emptyDesc")}
          action={
            <Button variant="outline" onClick={() => setView({ name: "home" })}>
              {t("nav.feed")}
            </Button>
          }
        />
      )}

      {!isLoading && photos && photos.length > 0 && (
        <div className="masonry-grid">
          {photos.map((p, i) => (
            <PhotoCard key={p.id} photo={p} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

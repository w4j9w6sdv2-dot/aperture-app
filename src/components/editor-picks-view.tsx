"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Star, Camera } from "lucide-react"
import { PhotoCard, PhotoCardSkeleton, type Photo } from "@/components/photo-card"
import { useT } from "@/lib/i18n"

interface EditorPicksViewProps {
  onPhotoClick?: (photoId: string) => void
  onAuthorClick?: (userId: string) => void
}

export function EditorPicksView({ onPhotoClick, onAuthorClick }: EditorPicksViewProps) {
  const t = useT()

  const { data, isLoading } = useQuery({
    queryKey: ["editor-picks"],
    queryFn: async () => {
      const res = await fetch("/api/editor-picks")
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{ items: Photo[] }>
    },
  })

  const photos = data?.items ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[#E60023]/10 flex items-center justify-center">
          <Star className="h-5 w-5 text-[#E60023] fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("editor.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("editor.subtitle")}</p>
        </div>
      </div>

      {/* Photos */}
      {isLoading ? (
        <div className="masonry-grid">
          {Array.from({ length: 8 }).map((_, i) => <PhotoCardSkeleton key={i} />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Camera className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t("editor.empty")}</p>
        </div>
      ) : (
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
      )}
    </div>
  )
}

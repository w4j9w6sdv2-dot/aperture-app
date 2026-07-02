"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ArrowLeft, FolderOpen, Trash2, Loader2, Bookmark } from "lucide-react"
import { PhotoCard, PhotoCardSkeleton, type Photo } from "@/components/photo-card"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

interface CollectionDetailViewProps {
  collectionId: string
  onBack: () => void
  onPhotoClick?: (photoId: string) => void
  onAuthorClick?: (userId: string) => void
}

export function CollectionDetailView({ collectionId, onBack, onPhotoClick, onAuthorClick }: CollectionDetailViewProps) {
  const t = useT()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: async () => {
      const res = await fetch(`/api/collections/${collectionId}`)
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{
        id: string
        name: string
        description: string | null
        isPrivate: boolean
        createdAt: string
        owner: { id: string; username: string; avatarUrl?: string | null }
        isOwner: boolean
        photos: Photo[]
      }>
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const res = await fetch(`/api/photos/${photoId}/save?collectionId=${collectionId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection", collectionId] })
      qc.invalidateQueries({ queryKey: ["collections"] })
      toast.success(t("collection.photoRemoved"))
    },
    onError: () => toast.error(t("common.error")),
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="h-8 w-20 bg-muted animate-pulse rounded mb-6" />
        <div className="masonry-grid">
          {Array.from({ length: 6 }).map((_, i) => <PhotoCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("common.error")}</p>
        <Button onClick={onBack} variant="outline" className="mt-4">{t("photo.back")}</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t("photo.back")}</span>
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-muted-foreground" />
          {data.name}
          {data.isPrivate && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {t("collection.private")}
            </span>
          )}
        </h1>
        {data.description && (
          <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {data.photos.length} {t("profile.photos")}
        </p>
      </div>

      {data.photos.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bookmark className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t("collection.empty")}</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {data.photos.map((photo, i) => (
            <div key={photo.id} className="relative group/wrap">
              <PhotoCard
                photo={photo}
                index={i}
                onClick={() => onPhotoClick?.(photo.id)}
                onAuthorClick={onAuthorClick}
              />
              {data.isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeMutation.mutate(photo.id)
                  }}
                  className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-black/60 hover:bg-[#E60023] text-white flex items-center justify-center opacity-0 group-hover/wrap:opacity-100 transition-all"
                  aria-label={t("collection.removePhoto")}
                  disabled={removeMutation.isPending}
                >
                  {removeMutation.isPending && removeMutation.variables === photo.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

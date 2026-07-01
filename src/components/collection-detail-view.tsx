"use client"

import { motion } from "framer-motion"
import {
  ArrowLeft,
  FolderHeart,
  Trash2,
  X,
  ImageOff,
  Lock,
  Heart,
  Eye,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import {
  useCollection,
  useDeleteCollection,
  useUnsavePhoto,
} from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { formatCount, formatRelativeTime, initialsFromName } from "@/lib/utils"
import { toast } from "sonner"

export function CollectionDetailView() {
  const t = useT()
  const collectionId = useAppStore((s) =>
    s.view.name === "collection" ? s.view.collectionId : null
  )
  const goBack = useAppStore((s) => s.goBack)
  const setView = useAppStore((s) => s.setView)
  const { data: collection, isLoading, isError } = useCollection(collectionId)
  const deleteMut = useDeleteCollection()
  const unsaveMut = useUnsavePhoto()

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> {t("photo.back")}
        </Button>
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !collection) {
    return (
      <EmptyState
        icon={ImageOff}
        title={t("photo.notFound")}
        description={t("photo.notFoundDesc")}
        action={
          <Button onClick={() => setView({ name: "collections" })}>
            {t("collection.title")}
          </Button>
        }
      />
    )
  }

  const handleDelete = () => {
    deleteMut.mutate(collection.id, {
      onSuccess: () => {
        toast.success(t("toast.collectionDeleted"))
        setView({ name: "collections" })
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const handleRemovePhoto = (photoId: string) => {
    unsaveMut.mutate(
      { photoId, collectionId: collection.id },
      {
        onSuccess: () => toast.success(t("toast.photoRemovedFromCollection")),
        onError: (e) => toast.error(e.message),
      }
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> {t("photo.back")}
      </Button>

      {/* Header */}
      <Card className="p-5 sm:p-6 bg-muted/30 border-border/60 space-y-3">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
            <FolderHeart className="h-6 w-6 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold truncate">{collection.name}</h1>
              {collection.isPrivate && (
                <Badge variant="outline" className="gap-1 text-amber-700 border-amber-200 bg-amber-50">
                  <Lock className="h-3 w-3" /> {t("collection.private")}
                </Badge>
              )}
            </div>
            {collection.description && (
              <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <button
                onClick={() => setView({ name: "profile", userId: collection.owner.id })}
                className="flex items-center gap-1.5 hover:text-rose-500 transition-colors"
              >
                <Avatar className="h-5 w-5">
                  {collection.owner.avatarUrl ? (
                    <AvatarImage src={collection.owner.avatarUrl} alt={collection.owner.username} />
                  ) : null}
                  <AvatarFallback className="text-[10px] bg-muted">
                    {initialsFromName(collection.owner.username)}
                  </AvatarFallback>
                </Avatar>
                {collection.isOwner ? t("collection.you") : collection.owner.username}
              </button>
              <span>·</span>
              <span>
                {formatCount(collection.photos.length)} {t("collection.photos")}
              </span>
            </div>
          </div>
          {collection.isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-rose-500 shrink-0"
                  aria-label={t("collection.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("collection.delete")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("collection.deleteConfirm")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {t("common.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </Card>

      {/* Photos */}
      {collection.photos.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title={t("collection.noPhotos")}
          description={t("collection.noPhotosDesc")}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {collection.photos.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.4) }}
              className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer bg-muted"
              onClick={() => setView({ name: "photo", photoId: p.id })}
            >
              <img
                src={p.imageUrl}
                alt={p.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-sm font-semibold text-white line-clamp-1">{p.title}</p>
                <p className="text-xs text-white/70 flex items-center gap-2 mt-1">
                  <Heart className="h-3 w-3" /> {formatCount(p.likeCount)}
                  <Eye className="h-3 w-3 ml-1" /> {formatCount(p.viewCount ?? 0)}
                </p>
              </div>

              {collection.isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemovePhoto(p.id)
                  }}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  aria-label={t("photo.removeSave")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              <div className="absolute top-2 left-2 text-[10px] text-white/80 bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5">
                {formatRelativeTime(p.addedAt)}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ArrowLeft, Camera, Heart, ImageIcon, Calendar } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useT } from "@/lib/i18n"
import { initialsFromName, formatCount, formatDate } from "@/lib/utils"

interface ProfileViewProps {
  userId: string
  onBack: () => void
  onPhotoClick?: (photoId: string) => void
}

interface UserProfile {
  id: string
  username: string
  bio: string | null
  avatarUrl: string | null
  createdAt: string
  isMe: boolean
  photoCount: number
  likesReceived: number
  photos: {
    id: string
    title: string
    imageUrl: string
    createdAt: string
    likeCount: number
    commentCount: number
    likedByMe: boolean
  }[]
}

export function ProfileView({ userId, onBack, onPhotoClick }: ProfileViewProps) {
  const t = useT()

  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <Skeleton className="h-8 w-20 mb-6" />
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("common.error")}</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          {t("photo.back")}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t("photo.back")}</span>
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8"
      >
        <Avatar className="h-24 w-24 ring-2 ring-border">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user.username} />
          ) : null}
          <AvatarFallback className="text-2xl font-bold bg-[#E60023]/10 text-[#E60023]">
            {initialsFromName(user.username)}
          </AvatarFallback>
        </Avatar>

        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="tabular-nums font-medium text-foreground">{formatCount(user.photoCount)}</span>
              <span>{t("profile.photos")}</span>
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              <span className="tabular-nums font-medium text-foreground">{formatCount(user.likesReceived)}</span>
              <span>{t("profile.likes")}</span>
            </span>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-1 mt-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{t("profile.joined")} {formatDate(user.createdAt)}</span>
          </div>
          {user.bio && (
            <p className="text-sm text-foreground/80 mt-3 max-w-md">{user.bio}</p>
          )}
        </div>
      </motion.div>

      {/* Photos grid */}
      <div className="border-t border-border/60 pt-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">
          {user.photoCount > 0
            ? `${user.photoCount} ${t("profile.photos")}`
            : t("profile.noPhotos")}
        </h2>

        {user.photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t("profile.noPhotosDesc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {user.photos.map((photo, i) => (
              <motion.button
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                onClick={() => onPhotoClick?.(photo.id)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-[#E60023] transition-all"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white line-clamp-1">{photo.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/80">
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-2.5 w-2.5" />
                      {formatCount(photo.likeCount)}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

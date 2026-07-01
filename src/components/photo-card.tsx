"use client"

import { Eye, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn, formatCount, initialsFromName } from "@/lib/utils"
import { LikeButton } from "@/components/like-button"
import { TagBadge } from "@/components/tag-badge"
import { useAppStore } from "@/lib/store"
import type { Photo } from "@/lib/api"

interface PhotoCardProps {
  photo: Photo
  index?: number
}

export function PhotoCard({ photo, index = 0 }: PhotoCardProps) {
  const setView = useAppStore((s) => s.setView)

  const openPhoto = () => setView({ name: "photo", photoId: photo.id })
  const openAuthor = (e: React.MouseEvent) => {
    e.stopPropagation()
    setView({ name: "profile", userId: photo.author.id })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="masonry-item group"
    >
      <Card
        onClick={openPhoto}
        className="overflow-hidden cursor-pointer p-0 bg-card border-border/60 hover:border-black/20 transition-all hover:shadow-xl hover:shadow-black/10 rounded-xl"
      >
        <div className="relative overflow-hidden">
          <img
            src={photo.imageUrl}
            alt={photo.title}
            loading="lazy"
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {/* hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <h3 className="text-sm font-semibold text-white line-clamp-1">
              {photo.title}
            </h3>
            {photo.description && (
              <p className="text-xs text-white/70 line-clamp-1 mt-0.5">
                {photo.description}
              </p>
            )}
          </div>
        </div>

        <div className="p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={openAuthor}
              className="flex items-center gap-2 min-w-0 group/author"
            >
              <Avatar className="h-7 w-7 ring-1 ring-border">
                {photo.author.avatarUrl ? (
                  <AvatarImage src={photo.author.avatarUrl} alt={photo.author.username} />
                ) : null}
                <AvatarFallback className="text-[10px] bg-muted">
                  {initialsFromName(photo.author.username)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium truncate group-hover/author:text-[#E60023] transition-colors">
                {photo.author.username}
              </span>
            </button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span className="tabular-nums">{formatCount(photo.commentCount * 3 + photo.likeCount * 7)}</span>
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="tabular-nums">{formatCount(photo.commentCount)}</span>
              </span>
              <LikeButton
                photoId={photo.id}
                liked={photo.likedByMe}
                count={photo.likeCount}
                size="sm"
                showCount
              />
            </div>
          </div>

          {photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {photo.tags.slice(0, 4).map((tag) => (
                <TagBadge key={tag} name={tag} />
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export function PhotoCardSkeleton() {
  return (
    <div className="masonry-item">
      <Card className="overflow-hidden p-0 bg-card border-border/60 rounded-xl">
        <div className="w-full h-64 bg-muted animate-pulse" />
        <div className="p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          </div>
          <div className={cn("h-3 w-16 bg-muted animate-pulse rounded")} />
        </div>
      </Card>
    </div>
  )
}

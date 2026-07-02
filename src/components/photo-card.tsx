"use client"

import { motion } from "framer-motion"
import { Heart, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LikeButton } from "@/components/like-button"
import { cn, formatCount, initialsFromName } from "@/lib/utils"

export interface Photo {
  id: string
  title: string
  description?: string | null
  imageUrl: string
  createdAt: string
  author: {
    id: string
    username: string
    avatarUrl?: string | null
  }
  tags: string[]
  category?: {
    id: string
    name: string
    slug: string
    icon: string | null
    isAdult: boolean
  } | null
  isAdult?: boolean
  likeCount?: number
  commentCount?: number
  likedByMe?: boolean
}

interface PhotoCardProps {
  photo: Photo
  index?: number
  onClick?: () => void
  onAuthorClick?: (userId: string) => void
}

export function PhotoCard({ photo, index = 0, onClick, onAuthorClick }: PhotoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="masonry-item group"
    >
      <div
        onClick={onClick}
        className="overflow-hidden cursor-pointer rounded-xl bg-card border border-border/60 hover:border-black/20 transition-all hover:shadow-xl hover:shadow-black/10"
      >
        <div className="relative overflow-hidden">
          <img
            src={photo.imageUrl}
            alt={photo.title}
            loading="lazy"
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {/* NSFW badge */}
          {photo.isAdult && (
            <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[#E60023] text-white font-medium border border-white/20">
              18+
            </span>
          )}
          {/* Hover overlay with title + author */}
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

        {/* Author info + stats under photo */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAuthorClick?.(photo.author.id)
              }}
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

            {/* Like + comment stats */}
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <LikeButton
                photoId={photo.id}
                liked={photo.likedByMe ?? false}
                count={photo.likeCount ?? 0}
                size="sm"
                showCount
              />
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="tabular-nums">{formatCount(photo.commentCount ?? 0)}</span>
              </span>
            </div>
          </div>

          {photo.tags.length > 0 && (
            <div className="flex gap-1 overflow-hidden">
              {photo.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded truncate max-w-[80px]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function PhotoCardSkeleton() {
  return (
    <div className="masonry-item">
      <div className="overflow-hidden rounded-xl bg-card border border-border/60">
        <div className="w-full h-64 bg-muted animate-pulse" />
        <div className="p-3 flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
          <div className="h-3 w-20 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}

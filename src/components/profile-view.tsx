"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  CalendarDays,
  Image as ImageIcon,
  Heart,
  Users,
  ArrowLeft,
  Camera,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PhotoCard } from "@/components/photo-card"
import { FollowButton } from "@/components/follow-button"
import { EmptyState } from "@/components/empty-state"
import { useUser, usePhotosInfinite, useCurrentUser } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { formatDate, formatCount, initialsFromName } from "@/lib/utils"

export function ProfileView() {
  const userId = useAppStore((s) =>
    s.view.name === "profile" ? s.view.userId : null
  )
  const goBack = useAppStore((s) => s.goBack)
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const { data: currentUser } = useCurrentUser()

  const { data: user, isLoading } = useUser(userId)
  const photosParams = useMemo(
    () => ({ authorId: userId ?? undefined, sort: "newest" as const }),
    [userId]
  )
  const photosQuery = usePhotosInfinite(photosParams, !!userId)
  const photos = photosQuery.data?.pages.flatMap((p) => p.items) ?? []

  if (isLoading || !user) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3 w-full">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
            <div className="flex gap-6">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Avatar className="h-24 w-24 ring-2 ring-border">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user.username} />
          ) : null}
          <AvatarFallback className="text-2xl bg-muted">
            {initialsFromName(user.username)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center sm:text-left w-full">
          <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{user.username}</h1>
            {user.isMe ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView({ name: "upload" })}
                className="gap-1.5"
              >
                <Camera className="h-4 w-4" /> Upload
              </Button>
            ) : (
              <FollowButton
                userId={user.id}
                isFollowing={!!user.isFollowing}
                size="sm"
              />
            )}
          </div>

          {user.bio && (
            <p className="text-sm text-muted-foreground mt-2 max-w-prose">
              {user.bio}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-5 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold tabular-nums">
                {formatCount(user.photoCount ?? 0)}
              </span>
              <span className="text-muted-foreground">Photos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold tabular-nums">
                {formatCount(user.followerCount ?? 0)}
              </span>
              <span className="text-muted-foreground">Followers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold tabular-nums">
                {formatCount(user.followingCount ?? 0)}
              </span>
              <span className="text-muted-foreground">Following</span>
            </div>
          </div>

          {user.createdAt && (
            <p className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground mt-3">
              <CalendarDays className="h-3 w-3" />
              Joined {formatDate(user.createdAt)}
            </p>
          )}
        </div>
      </div>

      {/* Photos */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          {user.isMe ? "Your photos" : "Photos"}
        </h2>

        {photosQuery.isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        )}

        {!photosQuery.isLoading && photos.length === 0 && (
          <EmptyState
            icon={ImageIcon}
            title={user.isMe ? "You haven't uploaded any photos" : "No photos yet"}
            description={
              user.isMe
                ? "Share your first photo with the community."
                : `${user.username} hasn't uploaded any photos yet.`
            }
            action={
              user.isMe && currentUser ? (
                <Button
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() => setView({ name: "upload" })}
                >
                  Upload a photo
                </Button>
              ) : !currentUser ? (
                <Button
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() => openAuth("signup")}
                >
                  Sign up to upload
                </Button>
              ) : undefined
            }
          />
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((p, i) => (
              <div key={p.id} className="aspect-square overflow-hidden rounded-lg group cursor-pointer relative" onClick={() => setView({ name: "photo", photoId: p.id })}>
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="text-white">
                    <p className="text-sm font-semibold line-clamp-1">{p.title}</p>
                    <p className="text-xs text-white/70 flex items-center gap-2 mt-1">
                      <Heart className="h-3 w-3" /> {formatCount(p.likeCount)}
                      <ImageIcon className="h-3 w-3 ml-1" /> 0
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {photosQuery.hasNextPage && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => photosQuery.fetchNextPage()}
              disabled={photosQuery.isFetchingNextPage}
            >
              {photosQuery.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

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
  MapPin,
  Globe,
  Award,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PhotoCard } from "@/components/photo-card"
import { FollowButton } from "@/components/follow-button"
import { BadgeDisplay } from "@/components/badge-display"
import { EmptyState } from "@/components/empty-state"
import { useUser, usePhotosInfinite, useCurrentUser } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { formatDate, formatCount, initialsFromName } from "@/lib/utils"
import { useT } from "@/lib/i18n"

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
  const t = useT()

  if (isLoading || !user) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> {t("photo.back")}
        </Button>
        <Skeleton className="h-32 sm:h-48 w-full rounded-xl" />
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

  const socialLinks = (user.socialLinks ?? {}) as Record<string, string>

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> {t("photo.back")}
      </Button>

      {/* Cover */}
      {user.coverUrl && (
        <div className="relative -mt-2 -mx-4 sm:-mx-6 h-32 sm:h-44 lg:h-52 overflow-hidden bg-muted">
          <img
            src={user.coverUrl}
            alt={`${user.username} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className={user.coverUrl ? "-mt-12 sm:-mt-16" : ""}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="h-24 w-24 ring-4 ring-background shrink-0">
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
                  <Camera className="h-4 w-4" /> {t("header.upload")}
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

            {/* Location + website */}
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.location}
                </span>
              )}
              {user.websiteUrl && (
                <a
                  href={user.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-rose-500 transition-colors"
                >
                  <Globe className="h-3 w-3" />
                  {user.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
              {Object.entries(socialLinks).map(([key, val]) =>
                val ? (
                  <a
                    key={key}
                    href={val.startsWith("http") ? val : `https://${val}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-rose-500 transition-colors capitalize"
                  >
                    {key}
                  </a>
                ) : null
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-5 mt-4 text-sm">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold tabular-nums">
                  {formatCount(user.photoCount ?? 0)}
                </span>
                <span className="text-muted-foreground">{t("profile.photos")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold tabular-nums">
                  {formatCount(user.followerCount ?? 0)}
                </span>
                <span className="text-muted-foreground">{t("profile.followers")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold tabular-nums">
                  {formatCount(user.followingCount ?? 0)}
                </span>
                <span className="text-muted-foreground">{t("profile.following")}</span>
              </div>
            </div>

            {user.createdAt && (
              <p className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground mt-3">
                <CalendarDays className="h-3 w-3" />
                {t("profile.joined")} {formatDate(user.createdAt)}
              </p>
            )}

            {/* Badges */}
            {user.badges && user.badges.length > 0 && (
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-4 flex-wrap">
                <Award className="h-3.5 w-3.5 text-amber-500" />
                <BadgeDisplay badges={user.badges} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photos */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          {user.isMe ? t("profile.yourPhotos") : t("profile.photosTitle")}
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
            title={user.isMe ? t("profile.noPhotosYou") : t("profile.noPhotos")}
            description={
              user.isMe
                ? t("profile.shareFirst")
                : t("profile.userNoPhotos", { user: user.username })
            }
            action={
              user.isMe && currentUser ? (
                <Button
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() => setView({ name: "upload" })}
                >
                  {t("feed.uploadAction")}
                </Button>
              ) : !currentUser ? (
                <Button
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() => openAuth("signup")}
                >
                  {t("profile.signupToUpload")}
                </Button>
              ) : undefined
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
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => photosQuery.fetchNextPage()}
              disabled={photosQuery.isFetchingNextPage}
            >
              {photosQuery.isFetchingNextPage ? t("common.loading") : t("feed.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

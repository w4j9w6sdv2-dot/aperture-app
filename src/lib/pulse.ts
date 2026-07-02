import { db } from "@/lib/db"

/**
 * Pulse score algorithm (inspired by 500px Pulse):
 * score = (likes * 5) + (comments * 3) + (views * 1) + (saves * 4)
 *
 * Higher score = more visible in "Popular" and "Trending" feeds.
 */
export async function recalcPulseScore(photoId: string) {
  const [likeCount, commentCount, viewCount, saveCount] = await Promise.all([
    db.like.count({ where: { photoId } }),
    db.comment.count({ where: { photoId } }),
    db.photoView.count({ where: { photoId } }),
    db.savedPhoto.count({ where: { photoId } }),
  ])

  const pulseScore = likeCount * 5 + commentCount * 3 + viewCount * 1 + saveCount * 4

  await db.photo.update({ where: { id: photoId }, data: { pulseScore } })
  return pulseScore
}

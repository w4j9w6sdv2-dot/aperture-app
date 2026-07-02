import { db } from "@/lib/db"

/**
 * Pulse score = (likes * 5) + (comments * 3) + (views * 1) + (saves * 4)
 * Recalculated and stored on the photo whenever likes/comments/views/saves change.
 */
export async function recalcPulseScore(photoId: string): Promise<number> {
  const [likes, comments, views, saves] = await Promise.all([
    db.like.count({ where: { photoId } }),
    db.comment.count({ where: { photoId } }),
    db.photoView.count({ where: { photoId } }),
    db.savedPhoto.count({ where: { photoId } }),
  ])

  const score = likes * 5 + comments * 3 + views * 1 + saves * 4

  await db.photo.update({
    where: { id: photoId },
    data: { pulseScore: score },
  })

  return score
}

export const PULSE_WEIGHTS = {
  like: 5,
  comment: 3,
  view: 1,
  save: 4,
} as const

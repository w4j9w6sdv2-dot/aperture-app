// Aperture seed v2 part 2 — relations (likes, comments, follows, views, collections, contests, badges, notifications)
import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

async function main() {
  console.log("🔗 Adding relations...")

  const users = await db.user.findMany()
  const uMap = Object.fromEntries(users.map((u) => [u.username, u.id]))
  const photos = await db.photo.findMany({ include: { author: true } })
  console.log(`Found ${users.length} users, ${photos.length} photos`)

  // Likes
  let likeCount = 0
  for (const p of photos) {
    const otherUsers = users.filter((u) => u.id !== p.authorId)
    const likers = otherUsers.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3))
    for (const u of likers) {
      try { await db.like.create({ data: { userId: u.id, photoId: p.id } }); likeCount++ } catch {}
    }
  }
  console.log(`✓ ${likeCount} likes`)

  // Comments
  const commentTexts = [
    "Stunning composition! The light is perfect.",
    "Love the mood in this one.",
    "Great use of depth of field.",
    "This is breathtaking.",
    "The colors are incredible.",
    "Beautiful work, keep it up!",
    "Such a peaceful frame.",
    "Masterful timing.",
  ]
  let commentCount = 0
  for (const p of photos) {
    const otherUsers = users.filter((u) => u.id !== p.authorId)
    const numComments = 1 + Math.floor(Math.random() * 2)
    const commenters = otherUsers.sort(() => Math.random() - 0.5).slice(0, numComments)
    for (const u of commenters) {
      try {
        await db.comment.create({ data: {
          body: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          authorId: u.id, photoId: p.id,
        }})
        commentCount++
      } catch {}
    }
  }
  console.log(`✓ ${commentCount} comments`)

  // Views
  let viewCount = 0
  for (const p of photos) {
    const numViews = 5 + Math.floor(Math.random() * 10)
    for (let v = 0; v < numViews; v++) {
      try {
        const otherUsers = users.filter((u) => u.id !== p.authorId)
        const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)]
        await db.photoView.create({ data: {
          photoId: p.id,
          userId: Math.random() > 0.5 ? randomUser.id : null,
        }})
        viewCount++
      } catch {}
    }
  }
  console.log(`✓ ${viewCount} views`)

  // Follows
  const followPairs = [
    ["mara_lens","duke_bw"], ["mara_lens","aiko_frames"], ["mara_lens","leo_exposure"],
    ["duke_bw","aiko_frames"], ["duke_bw","nora_pixel"],
    ["aiko_frames","mara_lens"], ["aiko_frames","leo_exposure"],
    ["leo_exposure","mara_lens"], ["leo_exposure","duke_bw"],
    ["nora_pixel","mara_lens"], ["nora_pixel","aiko_frames"],
  ]
  let followCount = 0
  for (const [a, b] of followPairs) {
    try { await db.follow.create({ data: { followerId: uMap[a], followingId: uMap[b] } }); followCount++ } catch {}
  }
  console.log(`✓ ${followCount} follows`)

  // Update pulse scores
  for (const p of photos) {
    const [likeCount, commentCount, viewCount, saveCount] = await Promise.all([
      db.like.count({ where: { photoId: p.id } }),
      db.comment.count({ where: { photoId: p.id } }),
      db.photoView.count({ where: { photoId: p.id } }),
      db.savedPhoto.count({ where: { photoId: p.id } }),
    ])
    const pulse = likeCount * 5 + commentCount * 3 + viewCount * 1 + saveCount * 4
    await db.photo.update({ where: { id: p.id }, data: { pulseScore: pulse } })
  }
  console.log("✓ pulse scores updated")

  // Collections
  const col1 = await db.collection.create({ data: {
    name: "Mountain Dreams", description: "My favorite landscape captures",
    ownerId: uMap.mara_lens, isPrivate: false,
  }})
  const col2 = await db.collection.create({ data: {
    name: "Inspiration", description: "Photos that move me",
    ownerId: uMap.mara_lens, isPrivate: false,
  }})
  const col3 = await db.collection.create({ data: {
    name: "NYC Streets", description: "Black & white street work",
    ownerId: uMap.duke_bw, isPrivate: false,
  }})
  const landscapes = photos.filter((p) => p.categoryId && p.location?.includes("Dolomites") || p.location?.includes("Norway") || p.location?.includes("Iceland")).slice(0, 4)
  const portraits = photos.filter((p) => p.location?.includes("Tokyo") || p.location?.includes("Milan")).slice(0, 3)
  const streets = photos.filter((p) => p.location?.includes("New York") || p.location?.includes("London") || p.location?.includes("Tokyo")).slice(0, 4)
  for (const p of landscapes) await db.savedPhoto.create({ data: { collectionId: col1.id, photoId: p.id } }).catch(() => {})
  for (const p of [...landscapes.slice(0,2), ...portraits]) await db.savedPhoto.create({ data: { collectionId: col2.id, photoId: p.id } }).catch(() => {})
  for (const p of streets) await db.savedPhoto.create({ data: { collectionId: col3.id, photoId: p.id } }).catch(() => {})
  console.log("✓ 3 collections with saved photos")

  // Contests
  const now = new Date()
  const contest1 = await db.contest.create({ data: {
    title: "Golden Hour Magic",
    description: "Submit your best photo captured during golden hour — that magical time just after sunrise or before sunset when the light is soft, warm, and directional. Show us how you harness the most beautiful light of the day.",
    theme: "Golden Hour",
    prize: "Featured on the Aperture homepage for a week + Golden Hour Master badge",
    startsAt: now,
    endsAt: new Date(now.getTime() + 14 * 24 * 3600 * 1000),
    status: "active",
    bannerUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80",
  }})
  const contest2 = await db.contest.create({ data: {
    title: "Urban Geometry",
    description: "Cities are full of lines, shapes, and patterns. Capture the geometric beauty of urban architecture — leading lines, symmetries, contrasts. Black & white or color, both welcome.",
    theme: "Urban Geometry",
    prize: "Featured collection + Urban Eye badge",
    startsAt: now,
    endsAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
    status: "active",
    bannerUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1600&q=80",
  }})

  // Contest entries
  const allCats = await db.category.findMany()
  const catMap = Object.fromEntries(allCats.map((c) => [c.slug, c.id]))
  const landscapesForContest = photos.filter((p) => p.categoryId === catMap.landscapes).slice(0, 6)
  const portraitsForContest = photos.filter((p) => p.categoryId === catMap.portraits).slice(0, 2)
  const urbanForContest = [
    ...photos.filter((p) => p.categoryId === catMap.architecture).slice(0, 4),
    ...photos.filter((p) => p.categoryId === catMap.street).slice(0, 3),
  ]
  let entryCount = 0, voteCount = 0
  for (const p of [...landscapesForContest, ...portraitsForContest]) {
    try {
      const entry = await db.contestEntry.create({ data: { contestId: contest1.id, photoId: p.id, userId: p.authorId } })
      entryCount++
      const voters = users.filter((u) => u.id !== p.authorId).sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3))
      for (const v of voters) {
        try { await db.contestVote.create({ data: { contestId: contest1.id, entryId: entry.id, userId: v.id } }); voteCount++ } catch {}
      }
    } catch {}
  }
  for (const p of urbanForContest) {
    try {
      const entry = await db.contestEntry.create({ data: { contestId: contest2.id, photoId: p.id, userId: p.authorId } })
      entryCount++
      const voters = users.filter((u) => u.id !== p.authorId).sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3))
      for (const v of voters) {
        try { await db.contestVote.create({ data: { contestId: contest2.id, entryId: entry.id, userId: v.id } }); voteCount++ } catch {}
      }
    } catch {}
  }
  console.log(`✓ 2 contests, ${entryCount} entries, ${voteCount} votes`)

  // Badges
  const badge1 = await db.badge.create({ data: { name: "Early Adopter", icon: "Rocket", color: "#E60023" } })
  const badge2 = await db.badge.create({ data: { name: "Top Contributor", icon: "TrendingUp", color: "#FF8A00" } })
  const badge3 = await db.badge.create({ data: { name: "Featured Artist", icon: "Star", color: "#0084FF" } })
  await db.userBadge.create({ data: { userId: uMap.mara_lens, badgeId: badge1.id } })
  await db.userBadge.create({ data: { userId: uMap.mara_lens, badgeId: badge3.id } })
  await db.userBadge.create({ data: { userId: uMap.duke_bw, badgeId: badge1.id } })
  await db.userBadge.create({ data: { userId: uMap.duke_bw, badgeId: badge2.id } })
  await db.userBadge.create({ data: { userId: uMap.aiko_frames, badgeId: badge3.id } })
  await db.userBadge.create({ data: { userId: uMap.leo_exposure, badgeId: badge1.id } })
  await db.userBadge.create({ data: { userId: uMap.nora_pixel, badgeId: badge2.id } })
  console.log("✓ 3 badges awarded to users")

  // Notifications for mara_lens
  const notifs = [
    { userId: uMap.mara_lens, type: "like", actorId: uMap.duke_bw, text: "duke_bw liked your photo \"Mountain Lake Mirror\"" },
    { userId: uMap.mara_lens, type: "comment", actorId: uMap.aiko_frames, text: "aiko_frames commented on your photo" },
    { userId: uMap.mara_lens, type: "follow", actorId: uMap.leo_exposure, text: "leo_exposure started following you" },
    { userId: uMap.mara_lens, type: "editor_pick", text: "Your photo \"Mountain Lake Mirror\" was selected as Editor's Pick!" },
  ]
  for (const n of notifs) await db.notification.create({ data: n })
  console.log(`✓ ${notifs.length} notifications`)

  console.log("\n✅ Relations seed completed!")
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())

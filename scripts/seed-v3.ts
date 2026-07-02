// Aperture seed v2 part 3 — fast: follows, pulse, collections, contests, badges, notifications
import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

async function main() {
  const users = await db.user.findMany()
  const uMap = Object.fromEntries(users.map((u) => [u.username, u.id]))
  const photos = await db.photo.findMany({ include: { author: true } })

  // Follows
  const followPairs = [
    ["mara_lens","duke_bw"], ["mara_lens","aiko_frames"], ["mara_lens","leo_exposure"],
    ["duke_bw","aiko_frames"], ["duke_bw","nora_pixel"],
    ["aiko_frames","mara_lens"], ["aiko_frames","leo_exposure"],
    ["leo_exposure","mara_lens"], ["leo_exposure","duke_bw"],
    ["nora_pixel","mara_lens"], ["nora_pixel","aiko_frames"],
  ]
  let fc = 0
  for (const [a, b] of followPairs) {
    try { await db.follow.create({ data: { followerId: uMap[a], followingId: uMap[b] } }); fc++ } catch {}
  }
  console.log(`✓ ${fc} follows`)

  // Pulse scores
  for (const p of photos) {
    const [l, c, v, s] = await Promise.all([
      db.like.count({ where: { photoId: p.id } }),
      db.comment.count({ where: { photoId: p.id } }),
      db.photoView.count({ where: { photoId: p.id } }),
      db.savedPhoto.count({ where: { photoId: p.id } }),
    ])
    await db.photo.update({ where: { id: p.id }, data: { pulseScore: l*5 + c*3 + v*1 + s*4 } })
  }
  console.log("✓ pulse scores updated")

  // Collections
  const col1 = await db.collection.create({ data: { name: "Mountain Dreams", description: "My favorite landscape captures", ownerId: uMap.mara_lens }})
  const col2 = await db.collection.create({ data: { name: "Inspiration", description: "Photos that move me", ownerId: uMap.mara_lens }})
  const col3 = await db.collection.create({ data: { name: "NYC Streets", description: "Black & white street work", ownerId: uMap.duke_bw }})

  const landscapes = photos.filter((p) => p.location?.match(/Dolomites|Norway|Iceland|Tuscany|Highlands|Ireland/)).slice(0, 4)
  const portraits = photos.filter((p) => p.location?.match(/Tokyo|Milan/)).slice(0, 3)
  const streets = photos.filter((p) => p.location?.match(/New York|London|Tokyo|Rome/)).slice(0, 4)
  for (const p of landscapes) await db.savedPhoto.create({ data: { collectionId: col1.id, photoId: p.id }}).catch(()=>{})
  for (const p of [...landscapes.slice(0,2), ...portraits]) await db.savedPhoto.create({ data: { collectionId: col2.id, photoId: p.id }}).catch(()=>{})
  for (const p of streets) await db.savedPhoto.create({ data: { collectionId: col3.id, photoId: p.id }}).catch(()=>{})
  console.log("✓ 3 collections with photos")

  // Contests
  const now = new Date()
  const contest1 = await db.contest.create({ data: {
    title: "Golden Hour Magic",
    description: "Submit your best photo captured during golden hour. Show us how you harness the most beautiful light of the day.",
    theme: "Golden Hour",
    prize: "Featured on the Aperture homepage for a week + Golden Hour Master badge",
    startsAt: now, endsAt: new Date(now.getTime() + 14*24*3600*1000), status: "active",
    bannerUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80",
  }})
  const contest2 = await db.contest.create({ data: {
    title: "Urban Geometry",
    description: "Capture the geometric beauty of urban architecture — leading lines, symmetries, contrasts.",
    theme: "Urban Geometry",
    prize: "Featured collection + Urban Eye badge",
    startsAt: now, endsAt: new Date(now.getTime() + 7*24*3600*1000), status: "active",
    bannerUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1600&q=80",
  }})

  // Contest entries
  const allCats = await db.category.findMany()
  const catMap = Object.fromEntries(allCats.map((c) => [c.slug, c.id]))
  const c1Entries = [
    ...photos.filter((p) => p.categoryId === catMap.landscapes).slice(0, 6),
    ...photos.filter((p) => p.categoryId === catMap.portraits).slice(0, 2),
  ]
  const c2Entries = [
    ...photos.filter((p) => p.categoryId === catMap.architecture).slice(0, 4),
    ...photos.filter((p) => p.categoryId === catMap.street).slice(0, 3),
  ]
  let ec = 0, vc = 0
  for (const p of c1Entries) {
    try {
      const e = await db.contestEntry.create({ data: { contestId: contest1.id, photoId: p.id, userId: p.authorId }})
      ec++
      const voters = users.filter((u) => u.id !== p.authorId).sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random()*3))
      for (const v of voters) { try { await db.contestVote.create({ data: { contestId: contest1.id, entryId: e.id, userId: v.id }}); vc++ } catch {} }
    } catch {}
  }
  for (const p of c2Entries) {
    try {
      const e = await db.contestEntry.create({ data: { contestId: contest2.id, photoId: p.id, userId: p.authorId }})
      ec++
      const voters = users.filter((u) => u.id !== p.authorId).sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random()*3))
      for (const v of voters) { try { await db.contestVote.create({ data: { contestId: contest2.id, entryId: e.id, userId: v.id }}); vc++ } catch {} }
    } catch {}
  }
  console.log(`✓ 2 contests, ${ec} entries, ${vc} votes`)

  // Badges
  const b1 = await db.badge.create({ data: { name: "Early Adopter", icon: "Rocket", color: "#E60023" }})
  const b2 = await db.badge.create({ data: { name: "Top Contributor", icon: "TrendingUp", color: "#FF8A00" }})
  const b3 = await db.badge.create({ data: { name: "Featured Artist", icon: "Star", color: "#0084FF" }})
  await db.userBadge.create({ data: { userId: uMap.mara_lens, badgeId: b1.id }})
  await db.userBadge.create({ data: { userId: uMap.mara_lens, badgeId: b3.id }})
  await db.userBadge.create({ data: { userId: uMap.duke_bw, badgeId: b1.id }})
  await db.userBadge.create({ data: { userId: uMap.duke_bw, badgeId: b2.id }})
  await db.userBadge.create({ data: { userId: uMap.aiko_frames, badgeId: b3.id }})
  await db.userBadge.create({ data: { userId: uMap.leo_exposure, badgeId: b1.id }})
  await db.userBadge.create({ data: { userId: uMap.nora_pixel, badgeId: b2.id }})
  console.log("✓ 3 badges awarded")

  // Notifications
  const notifs = [
    { userId: uMap.mara_lens, type: "like", actorId: uMap.duke_bw, text: 'duke_bw liked your photo "Mountain Lake Mirror"' },
    { userId: uMap.mara_lens, type: "comment", actorId: uMap.aiko_frames, text: "aiko_frames commented on your photo" },
    { userId: uMap.mara_lens, type: "follow", actorId: uMap.leo_exposure, text: "leo_exposure started following you" },
    { userId: uMap.mara_lens, type: "editor_pick", text: 'Your photo "Mountain Lake Mirror" was selected as Editor\'s Pick!' },
  ]
  for (const n of notifs) await db.notification.create({ data: n })
  console.log(`✓ ${notifs.length} notifications`)

  console.log("\n✅ Done!")
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())

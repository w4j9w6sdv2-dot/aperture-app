// Aperture seed v2 — full platform data
// Run: DATABASE_URL=... bunx tsx scripts/seed-v2.ts
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

const UNSPLASH = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`

const PHOTOS = [
  // Landscapes
  { id: "1506905925346-21bda4d32df4", title: "Mountain Lake Mirror", cat: "landscapes", tags: ["mountains","nature","reflection"], license: "cc-by", exif: { camera: "Canon EOS R5", lens: "RF 24-70mm f/2.8L", focal: "35mm", aperture: "f/8", shutter: "1/125s", iso: "ISO 100" }, loc: "Dolomites, Italy" },
  { id: "1500530855697-b586d89ba3ee", title: "Forest Path", cat: "landscapes", tags: ["forest","nature","path"], license: "cc-by", exif: { camera: "Sony A7 IV", lens: "FE 16-35mm f/2.8 GM", focal: "24mm", aperture: "f/5.6", shutter: "1/200s", iso: "ISO 200" }, loc: "Black Forest, Germany" },
  { id: "1469474968028-56623f02e42e", title: "Valley at Golden Hour", cat: "landscapes", tags: ["valley","sunset","golden-hour"], license: "cc-by-nc", exif: { camera: "Nikon Z7", lens: "Z 24-70mm f/4 S", focal: "28mm", aperture: "f/11", shutter: "1/80s", iso: "ISO 100" }, loc: "Tuscany, Italy" },
  { id: "1470071459604-3b5ec3a7fe05", title: "Foggy Mountains", cat: "landscapes", tags: ["fog","mountains","mood"], license: "cc0", exif: { camera: "Fujifilm X-T5", lens: "XF 10-24mm f/4", focal: "16mm", aperture: "f/8", shutter: "1/250s", iso: "ISO 400" }, loc: "Scottish Highlands" },

  // Portraits
  { id: "1544005313-94ddf0286df2", title: "Quiet Strength", cat: "portraits", tags: ["portrait","woman","natural-light"], license: "all-rights", exif: { camera: "Canon EOS R6", lens: "RF 85mm f/1.2L", focal: "85mm", aperture: "f/1.8", shutter: "1/200s", iso: "ISO 400" }, loc: "Tokyo, Japan" },
  { id: "1500648767791-00dcc994a43e", title: "The Thinker", cat: "portraits", tags: ["portrait","man","studio"], license: "cc-by", exif: { camera: "Sony A1", lens: "FE 50mm f/1.2 GM", focal: "50mm", aperture: "f/2.0", shutter: "1/160s", iso: "ISO 200" }, loc: "Studio, Berlin" },
  { id: "1502823403499-6ccfcf4fb453", title: "Window Light", cat: "portraits", tags: ["portrait","window-light","soft"], license: "cc-by-nc", exif: { camera: "Leica Q3", lens: "Summilux 28mm f/1.7", focal: "28mm", aperture: "f/2.8", shutter: "1/125s", iso: "ISO 800" }, loc: "Paris, France" },

  // Street
  { id: "1444723121867-7a241cacace9", title: "City Night Walk", cat: "street", tags: ["street","night","neon"], license: "cc-by", exif: { camera: "Ricoh GR IIIx", lens: "GR 40mm f/2.8", focal: "40mm", aperture: "f/2.8", shutter: "1/30s", iso: "ISO 3200" }, loc: "Tokyo, Japan" },
  { id: "1502082553048-f009c37129b9", title: "Urban Strangers", cat: "street", tags: ["street","candid","urban"], license: "cc-by", exif: { camera: "Fujifilm X100V", lens: "fixed 23mm f/2", focal: "23mm", aperture: "f/4", shutter: "1/250s", iso: "ISO 800" }, loc: "New York, USA" },
  { id: "1522091235260-2b9d4f5f2a3f", title: "Rain Crossing", cat: "street", tags: ["rain","street","reflection"], license: "cc0", exif: { camera: "Leica M11", lens: "Summicron 35mm f/2", focal: "35mm", aperture: "f/2.8", shutter: "1/60s", iso: "ISO 1600" }, loc: "London, UK" },

  // Architecture
  { id: "1505144808419-1957a94ca61e", title: "White Symmetry", cat: "architecture", tags: ["minimal","white","geometry"], license: "cc-by", exif: { camera: "Sony A7R V", lens: "FE 12-24mm f/2.8 GM", focal: "14mm", aperture: "f/11", shutter: "1/200s", iso: "ISO 100" }, loc: "Berlin, Germany" },
  { id: "1518780664697-55e3ad937233", title: "Concrete Curves", cat: "architecture", tags: ["concrete","curves","modern"], license: "cc-by", exif: { camera: "Canon EOS R5", lens: "RF 15-35mm f/2.8L", focal: "15mm", aperture: "f/8", shutter: "1/125s", iso: "ISO 200" }, loc: "Valencia, Spain" },
  { id: "1480714378408-67cf0d13bc1b", title: "Skyline at Dusk", cat: "architecture", tags: ["skyline","cityscape","dusk"], license: "cc-by-nc", exif: { camera: "Nikon Z9", lens: "Z 70-200mm f/2.8 S", focal: "85mm", aperture: "f/8", shutter: "1/60s", iso: "ISO 400" }, loc: "Frankfurt, Germany" },

  // Nature
  { id: "1441974231531-c6227db76b6e", title: "Forest Whisper", cat: "nature", tags: ["forest","trees","green"], license: "cc-by", exif: { camera: "Sony A7 IV", lens: "FE 24-70mm f/2.8 GM", focal: "35mm", aperture: "f/5.6", shutter: "1/160s", iso: "ISO 400" }, loc: "Bavaria, Germany" },
  { id: "1418065460487-3e41a6c84dc5", title: "Green Hills", cat: "nature", tags: ["hills","green","landscape"], license: "cc0", exif: { camera: "Canon EOS R6", lens: "RF 24-105mm f/4L", focal: "50mm", aperture: "f/8", shutter: "1/200s", iso: "ISO 100" }, loc: "Ireland" },

  // Macro
  { id: "1490750967868-88aa4486c946", title: "Dandelion Wishes", cat: "macro", tags: ["dandelion","macro","bokeh"], license: "cc-by", exif: { camera: "Canon EOS R5", lens: "RF 100mm f/2.8L Macro", focal: "100mm", aperture: "f/4", shutter: "1/200s", iso: "ISO 200" }, loc: "Amsterdam, NL" },
  { id: "1416879595882-3373a0480b5b", title: "Dew Drop", cat: "macro", tags: ["dew","water","macro"], license: "cc-by-nc", exif: { camera: "Nikon Z7", lens: "Z MC 105mm f/2.8", focal: "105mm", aperture: "f/5.6", shutter: "1/160s", iso: "ISO 400" }, loc: "Studio, Amsterdam" },

  // Black & White
  { id: "1518837695005-2083093ee35b", title: "Wave Study", cat: "bw", tags: ["ocean","wave","bw"], license: "cc-by", exif: { camera: "Sony A1", lens: "FE 70-200mm f/2.8 GM", focal: "200mm", aperture: "f/5.6", shutter: "1/1000s", iso: "ISO 200" }, loc: "Portugal coast" },
  { id: "1452780212940-6f5c0d14d848", title: "Solitary Tree", cat: "bw", tags: ["tree","bw","minimal"], license: "cc0", exif: { camera: "Leica M10 Monochrom", lens: "Summilux 50mm f/1.4", focal: "50mm", aperture: "f/8", shutter: "1/250s", iso: "ISO 320" }, loc: "Iceland" },

  // Travel
  { id: "1502602898657-3e91760cbb34", title: "Parisian Corner", cat: "travel", tags: ["paris","street","travel"], license: "cc-by", exif: { camera: "Fujifilm X-T5", lens: "XF 23mm f/1.4 R", focal: "23mm", aperture: "f/2.8", shutter: "1/125s", iso: "ISO 400" }, loc: "Paris, France" },
  { id: "1467269204594-9661b134dd2b", title: "Tokyo Alley", cat: "travel", tags: ["tokyo","alley","neon"], license: "cc-by-nc", exif: { camera: "Ricoh GR III", lens: "GR 18mm f/2.8", focal: "18mm", aperture: "f/2.8", shutter: "1/30s", iso: "ISO 1600" }, loc: "Tokyo, Japan" },

  // More landscapes
  { id: "1426604966848-d7adac402bff", title: "River Valley", cat: "landscapes", tags: ["river","valley","mountains"], license: "cc-by", exif: { camera: "Canon EOS R5", lens: "RF 24-70mm f/2.8L", focal: "24mm", aperture: "f/11", shutter: "1/100s", iso: "ISO 100" }, loc: "Norway" },
  { id: "1433086966358-54859d0ed7df", title: "Waterfall Magic", cat: "landscapes", tags: ["waterfall","long-exposure","nature"], license: "cc-by", exif: { camera: "Sony A7 IV", lens: "FE 16-35mm f/2.8 GM", focal: "16mm", aperture: "f/16", shutter: "5s", iso: "ISO 100" }, loc: "Iceland" },

  // More portraits
  { id: "1438761681033-6461ffad8d80", title: "Soft Gaze", cat: "portraits", tags: ["portrait","woman","soft"], license: "all-rights", exif: { camera: "Canon EOS R6", lens: "RF 50mm f/1.2L", focal: "50mm", aperture: "f/1.4", shutter: "1/200s", iso: "ISO 200" }, loc: "Studio, Milan" },

  // More street
  { id: "1502672260266-ee505d7ee26a", title: "Cafe Window", cat: "street", tags: ["cafe","window","candid"], license: "cc-by", exif: { camera: "Fujifilm X100V", lens: "fixed 23mm f/2", focal: "23mm", aperture: "f/2.8", shutter: "1/125s", iso: "ISO 800" }, loc: "Rome, Italy" },

  // More architecture
  { id: "1496564203457-11bb12075d90", title: "Stair Geometry", cat: "architecture", tags: ["stairs","geometry","minimal"], license: "cc0", exif: { camera: "Sony A7R V", lens: "FE 24mm f/1.4 GM", focal: "24mm", aperture: "f/8", shutter: "1/160s", iso: "ISO 200" }, loc: "Vatican City" },
]

async function main() {
  console.log("🧹 Cleaning existing data...")
  await Promise.all([
    db.userBadge.deleteMany(),
    db.badge.deleteMany(),
    db.contestVote.deleteMany(),
    db.contestEntry.deleteMany(),
    db.contest.deleteMany(),
    db.notification.deleteMany(),
    db.photoView.deleteMany(),
    db.savedPhoto.deleteMany(),
    db.collection.deleteMany(),
    db.photoExif.deleteMany(),
    db.like.deleteMany(),
    db.comment.deleteMany(),
    db.taggedPhoto.deleteMany(),
    db.tag.deleteMany(),
    db.photo.deleteMany(),
    db.category.deleteMany(),
    db.follow.deleteMany(),
    db.user.deleteMany(),
  ])
  console.log("✓ Cleaned")

  // Categories
  console.log("📁 Creating categories...")
  const categories = await Promise.all([
    db.category.create({ data: { name: "Landscapes", slug: "landscapes", icon: "Mountain" } }),
    db.category.create({ data: { name: "Portraits", slug: "portraits", icon: "User" } }),
    db.category.create({ data: { name: "Street", slug: "street", icon: "Camera" } }),
    db.category.create({ data: { name: "Architecture", slug: "architecture", icon: "Building" } }),
    db.category.create({ data: { name: "Nature", slug: "nature", icon: "Leaf" } }),
    db.category.create({ data: { name: "Macro", slug: "macro", icon: "ZoomIn" } }),
    db.category.create({ data: { name: "Black & White", slug: "bw", icon: "Contrast" } }),
    db.category.create({ data: { name: "Travel", slug: "travel", icon: "Plane" } }),
  ])
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]))
  console.log(`✓ ${categories.length} categories`)

  // Users
  console.log("👤 Creating users...")
  const passwordHash = await bcrypt.hash("password123", 10)
  const users = await Promise.all([
    db.user.create({ data: {
      username: "mara_lens", email: "mara_lens@demo.com", passwordHash,
      bio: "Landscape photographer chasing golden hour across the Dolomites. Aperture wide, heart wider.",
      avatarUrl: "https://i.pravatar.cc/300?u=mara_lens",
      coverUrl: UNSPLASH("1506905925346-21bda4d32df4", 1600),
      location: "Cortina d'Ampezzo, Italy",
      websiteUrl: "https://maralens.example",
      socialLinks: { instagram: "@mara_lens", twitter: "@maralens" },
    }}),
    db.user.create({ data: {
      username: "duke_bw", email: "duke_bw@demo.com", passwordHash,
      bio: "Black & white street photographer. NYC is my canvas, light is my brush.",
      avatarUrl: "https://i.pravatar.cc/300?u=duke_bw",
      coverUrl: UNSPLASH("1444723121867-7a241cacace9", 1600),
      location: "New York, USA",
      websiteUrl: "https://dukebw.example",
      socialLinks: { instagram: "@duke.bw" },
    }}),
    db.user.create({ data: {
      username: "aiko_frames", email: "aiko_frames@demo.com", passwordHash,
      bio: "Portrait photographer from Tokyo. I look for quiet strength in every face.",
      avatarUrl: "https://i.pravatar.cc/300?u=aiko_frames",
      coverUrl: UNSPLASH("1544005313-94ddf0286df2", 1600),
      location: "Tokyo, Japan",
      socialLinks: { instagram: "@aiko.frames", twitter: "@aikoframes" },
    }}),
    db.user.create({ data: {
      username: "leo_exposure", email: "leo_exposure@demo.com", passwordHash,
      bio: "Architecture lines and concrete curves. Berlin-based, Europe-roaming.",
      avatarUrl: "https://i.pravatar.cc/300?u=leo_exposure",
      coverUrl: UNSPLASH("1518780664697-55e3ad937233", 1600),
      location: "Berlin, Germany",
      websiteUrl: "https://leoexposure.example",
    }}),
    db.user.create({ data: {
      username: "nora_pixel", email: "nora_pixel@demo.com", passwordHash,
      bio: "Macro world explorer. The smallest details tell the biggest stories.",
      avatarUrl: "https://i.pravatar.cc/300?u=nora_pixel",
      coverUrl: UNSPLASH("1490750967868-88aa4486c946", 1600),
      location: "Amsterdam, Netherlands",
      socialLinks: { instagram: "@nora.pixel" },
    }}),
  ])
  const uMap = Object.fromEntries(users.map((u) => [u.username, u.id]))
  console.log(`✓ ${users.length} users`)

  // Photos
  console.log("📸 Creating photos with EXIF...")
  const authorRotation = ["mara_lens", "duke_bw", "aiko_frames", "leo_exposure", "nora_pixel"]
  const editorPickIdx = [0, 4, 7, 10, 13, 17, 20, 23] // 8 editor picks
  const createdPhotos = []
  for (let i = 0; i < PHOTOS.length; i++) {
    const p = PHOTOS[i]
    const authorId = uMap[authorRotation[i % authorRotation.length]]
    const takenAt = new Date(Date.now() - (Math.random() * 365 * 24 * 3600 * 1000))
    const photo = await db.photo.create({
      data: {
        title: p.title,
        description: `A moment captured at ${p.loc}. ${p.tags.join(", ")}.`,
        imageUrl: UNSPLASH(p.id),
        authorId,
        categoryId: catMap[p.cat],
        location: p.loc,
        license: p.license,
        watermarked: false,
        isEditorPick: editorPickIdx.includes(i),
        pulseScore: Math.floor(Math.random() * 200) + 50,
        exif: { create: {
          camera: p.exif.camera,
          lens: p.exif.lens,
          focalLength: p.exif.focal,
          aperture: p.exif.aperture,
          shutterSpeed: p.exif.shutter,
          iso: p.exif.iso,
          takenAt,
        }},
      },
    })
    // Tags
    for (const t of p.tags) {
      const tag = await db.tag.upsert({ where: { name: t }, update: {}, create: { name: t } })
      await db.taggedPhoto.create({ data: { photoId: photo.id, tagId: tag.id } }).catch(() => {})
    }
    createdPhotos.push({ id: photo.id, author: authorRotation[i % authorRotation.length], cat: p.cat })
  }
  console.log(`✓ ${PHOTOS.length} photos with EXIF and tags`)

  // Likes, comments, follows, views
  console.log("❤️ Adding likes, comments, follows, views...")
  let likeCount = 0, commentCount = 0, viewCount = 0
  for (const p of createdPhotos) {
    // Random 2-4 likes from other users
    const otherUsers = Object.keys(uMap).filter((u) => u !== p.author)
    const likers = otherUsers.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3))
    for (const u of likers) {
      try { await db.like.create({ data: { userId: uMap[u], photoId: p.id } }); likeCount++ } catch {}
    }
    // 1-2 comments
    const comments = [
      "Stunning composition! The light is perfect.",
      "Love the mood in this one.",
      "Great use of depth of field.",
      "This is breathtaking.",
      "The colors are incredible.",
      "Beautiful work, keep it up!",
      "Such a peaceful frame.",
      "Masterful timing.",
    ]
    const numComments = 1 + Math.floor(Math.random() * 2)
    const commenters = otherUsers.sort(() => Math.random() - 0.5).slice(0, numComments)
    for (const u of commenters) {
      try {
        await db.comment.create({ data: {
          body: comments[Math.floor(Math.random() * comments.length)],
          authorId: uMap[u], photoId: p.id,
        }})
        commentCount++
      } catch {}
    }
    // Views (5-15)
    const numViews = 5 + Math.floor(Math.random() * 10)
    for (let v = 0; v < numViews; v++) {
      try {
        await db.photoView.create({ data: {
          photoId: p.id,
          userId: Math.random() > 0.5 ? uMap[otherUsers[Math.floor(Math.random() * otherUsers.length)]] : null,
        }})
        viewCount++
      } catch {}
    }
  }
  // Follows (mara → duke → aiko → leo → nora → mara, plus extra)
  const followPairs = [
    ["mara_lens","duke_bw"], ["mara_lens","aiko_frames"], ["mara_lens","leo_exposure"],
    ["duke_bw","aiko_frames"], ["duke_bw","nora_pixel"],
    ["aiko_frames","mara_lens"], ["aiko_frames","leo_exposure"],
    ["leo_exposure","mara_lens"], ["leo_exposure","duke_bw"],
    ["nora_pixel","mara_lens"], ["nora_pixel","aiko_frames"],
  ]
  for (const [a, b] of followPairs) {
    try { await db.follow.create({ data: { followerId: uMap[a], followingId: uMap[b] } }) } catch {}
  }
  console.log(`✓ ${likeCount} likes, ${commentCount} comments, ${viewCount} views, ${followPairs.length} follows`)

  // Collections
  console.log("📁 Creating collections...")
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
  // Save some photos
  const landscapes = createdPhotos.filter((p) => p.cat === "landscapes").slice(0, 4)
  const portraits = createdPhotos.filter((p) => p.cat === "portraits").slice(0, 3)
  const streets = createdPhotos.filter((p) => p.cat === "street").slice(0, 4)
  for (const p of landscapes) await db.savedPhoto.create({ data: { collectionId: col1.id, photoId: p.id } }).catch(() => {})
  for (const p of [...landscapes.slice(0,2), ...portraits]) await db.savedPhoto.create({ data: { collectionId: col2.id, photoId: p.id } }).catch(() => {})
  for (const p of streets) await db.savedPhoto.create({ data: { collectionId: col3.id, photoId: p.id } }).catch(() => {})
  console.log("✓ 3 collections")

  // Contests
  console.log("🏆 Creating contests...")
  const now = new Date()
  const contest1 = await db.contest.create({ data: {
    title: "Golden Hour Magic",
    description: "Submit your best photo captured during golden hour — that magical time just after sunrise or before sunset when the light is soft, warm, and directional. Show us how you harness the most beautiful light of the day.",
    theme: "Golden Hour",
    prize: "Featured on the Aperture homepage for a week + Golden Hour Master badge",
    startsAt: now,
    endsAt: new Date(now.getTime() + 14 * 24 * 3600 * 1000),
    status: "active",
    bannerUrl: UNSPLASH("1469474968028-56623f02e42e", 1600),
  }})
  const contest2 = await db.contest.create({ data: {
    title: "Urban Geometry",
    description: "Cities are full of lines, shapes, and patterns. Capture the geometric beauty of urban architecture — leading lines, symmetries, contrasts. Black & white or color, both welcome.",
    theme: "Urban Geometry",
    prize: "Featured collection + Urban Eye badge",
    startsAt: now,
    endsAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
    status: "active",
    bannerUrl: UNSPLASH("1518780664697-55e3ad937233", 1600),
  }})

  // Contest entries: golden hour gets landscapes, urban gets architecture+street
  const contest1Entries = createdPhotos.filter((p) => ["landscapes","portraits"].includes(p.cat)).slice(0, 8)
  const contest2Entries = createdPhotos.filter((p) => ["architecture","street","bw"].includes(p.cat)).slice(0, 7)
  for (const p of contest1Entries) {
    try {
      const entry = await db.contestEntry.create({ data: { contestId: contest1.id, photoId: p.id, userId: uMap[p.author] } })
      // 1-3 votes
      const voters = Object.keys(uMap).filter((u) => u !== p.author).sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3))
      for (const v of voters) {
        try { await db.contestVote.create({ data: { contestId: contest1.id, entryId: entry.id, userId: uMap[v] } }) } catch {}
      }
    } catch {}
  }
  for (const p of contest2Entries) {
    try {
      const entry = await db.contestEntry.create({ data: { contestId: contest2.id, photoId: p.id, userId: uMap[p.author] } })
      const voters = Object.keys(uMap).filter((u) => u !== p.author).sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3))
      for (const v of voters) {
        try { await db.contestVote.create({ data: { contestId: contest2.id, entryId: entry.id, userId: uMap[v] } }) } catch {}
      }
    } catch {}
  }
  console.log(`✓ 2 contests, ${contest1Entries.length + contest2Entries.length} entries`)

  // Badges
  console.log("🏅 Creating badges...")
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
  console.log("✓ 3 badges awarded")

  // Notifications for mara_lens
  console.log("🔔 Creating notifications...")
  const notifs = [
    { userId: uMap.mara_lens, type: "like", actorId: uMap.duke_bw, text: "duke_bw liked your photo \"Mountain Lake Mirror\"" },
    { userId: uMap.mara_lens, type: "comment", actorId: uMap.aiko_frames, text: "aiko_frames commented on your photo" },
    { userId: uMap.mara_lens, type: "follow", actorId: uMap.leo_exposure, text: "leo_exposure started following you" },
    { userId: uMap.mara_lens, type: "editor_pick", text: "Your photo \"Mountain Lake Mirror\" was selected as Editor's Pick!" },
  ]
  for (const n of notifs) {
    await db.notification.create({ data: n })
  }
  console.log(`✓ ${notifs.length} notifications`)

  // Summary
  const totals = {
    users: await db.user.count(),
    photos: await db.photo.count(),
    categories: await db.category.count(),
    likes: await db.like.count(),
    comments: await db.comment.count(),
    follows: await db.follow.count(),
    views: await db.photoView.count(),
    collections: await db.collection.count(),
    contests: await db.contest.count(),
    contestEntries: await db.contestEntry.count(),
    contestVotes: await db.contestVote.count(),
    editorPicks: await db.photo.count({ where: { isEditorPick: true } }),
    badges: await db.badge.count(),
    userBadges: await db.userBadge.count(),
    notifications: await db.notification.count(),
  }
  console.log("\n📊 SEED SUMMARY:")
  Object.entries(totals).forEach(([k, v]) => console.log(`  ${k.padEnd(20)} ${v}`))
  console.log("\n✅ Seed completed!")
  console.log("\n--- LOGIN CREDENTIALS ---")
  console.log("All demo users: password123")
  console.log("Emails: mara_lens@demo.com, duke_bw@demo.com, aiko_frames@demo.com, leo_exposure@demo.com, nora_pixel@demo.com")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })

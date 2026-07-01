import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

// ---- Aperture demo seed --------------------------------------------------
// 5 demo photographers, 20 demo photos with curated Unsplash IDs,
// tags, likes, comments, and follow relationships.
// Brand: Aperture — "Where photographers come alive."

const USERS = [
  {
    username: "mara_lens",
    email: "mara_lens@demo.com",
    password: "password123",
    bio: "Chasing golden hour across mountain ranges. Aperture wide, heart wider.",
    avatarUrl: "https://i.pravatar.cc/150?u=mara_lens",
  },
  {
    username: "duke_bw",
    email: "duke_bw@demo.com",
    password: "password123",
    bio: "Black & white forever. Light, shadow, and the space between.",
    avatarUrl: "https://i.pravatar.cc/150?u=duke_bw",
  },
  {
    username: "aiko_frames",
    email: "aiko_frames@demo.com",
    password: "password123",
    bio: "Tokyo streets, quiet portraits, and the rhythm of the city.",
    avatarUrl: "https://i.pravatar.cc/150?u=aiko_frames",
  },
  {
    username: "leo_exposure",
    email: "leo_exposure@demo.com",
    password: "password123",
    bio: "Long exposures, oceans, and forests. Patient photography for restless souls.",
    avatarUrl: "https://i.pravatar.cc/150?u=leo_exposure",
  },
  {
    username: "nora_pixel",
    email: "nora_pixel@demo.com",
    password: "password123",
    bio: "Architecture, geometry, and the quiet poetry of concrete.",
    avatarUrl: "https://i.pravatar.cc/150?u=nora_pixel",
  },
]

interface DemoPhoto {
  title: string
  description: string
  imageUrl: string
  tags: string[]
  authorIndex: number
}

// Curated Unsplash photo IDs (publicly accessible), spread across 5 authors
// (4 photos each = 20 photos total). Mix of landscape, portrait, architecture,
// nature, street, abstract, and B&W.
const PHOTOS: DemoPhoto[] = [
  // mara_lens — landscapes & mountains
  {
    title: "Mountain Lake Mirror",
    description:
      "Still water at dawn reflecting the peaks. Hiked three hours in the dark for this one frame.",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    tags: ["landscape", "mountains", "nature"],
    authorIndex: 0,
  },
  {
    title: "Valley at Golden Hour",
    description:
      "The light rolled across the valley floor like honey. I held my breath and pressed the shutter.",
    imageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80",
    tags: ["landscape", "mountains", "nature"],
    authorIndex: 0,
  },
  {
    title: "Foggy Ridges",
    description:
      "Layered ridges disappearing into morning fog. Sometimes silence is the real subject.",
    imageUrl:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80",
    tags: ["landscape", "nature", "mountains"],
    authorIndex: 0,
  },
  {
    title: "River Through the Valley",
    description: "A glacial river carving its way toward the horizon.",
    imageUrl:
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1200&q=80",
    tags: ["landscape", "nature", "mountains"],
    authorIndex: 0,
  },

  // duke_bw — black & white, abstract, stairwell, bridge
  {
    title: "Spiral Descent",
    description:
      "An old hotel stairwell, shot in monochrome to emphasize the geometry of the descent.",
    imageUrl:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80",
    tags: ["bw", "abstract", "architecture"],
    authorIndex: 1,
  },
  {
    title: "Bridge Lines",
    description: "Steel cables against a grey sky. Pure line and form.",
    imageUrl:
      "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1200&q=80",
    tags: ["bw", "urban", "abstract"],
    authorIndex: 1,
  },
  {
    title: "Cathedral of Concrete",
    description: "Brutalist geometry, late afternoon. Light that cuts like a knife.",
    imageUrl:
      "https://images.unsplash.com/photo-1439754299130-4c5b5271f1c2?w=1200&q=80",
    tags: ["bw", "architecture", "urban"],
    authorIndex: 1,
  },
  {
    title: "Night Crossing",
    description: "Wet pavement, single lamp, a stranger passing through frame.",
    imageUrl:
      "https://images.unsplash.com/photo-1517732306149-e8f829eb588a?w=1200&q=80",
    tags: ["bw", "street", "city"],
    authorIndex: 1,
  },

  // aiko_frames — street, portraits, city
  {
    title: "Paris in Motion",
    description: "A boulevard in Paris, 1/60s, just slow enough to feel the rush.",
    imageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
    tags: ["street", "city", "urban"],
    authorIndex: 2,
  },
  {
    title: "City After Dark",
    description:
      "Neon reflections on a quiet street. The city never really sleeps, it just whispers.",
    imageUrl:
      "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1200&q=80",
    tags: ["street", "city", "urban"],
    authorIndex: 2,
  },
  {
    title: "Window Light Portrait",
    description:
      "Soft north-facing light. No flash, no tricks — just a person and a window.",
    imageUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&q=80",
    tags: ["portrait", "city"],
    authorIndex: 2,
  },
  {
    title: "Quiet Portrait",
    description: "A moment of stillness between conversations.",
    imageUrl:
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=1200&q=80",
    tags: ["portrait", "city"],
    authorIndex: 2,
  },

  // leo_exposure — forests, oceans, long exposures
  {
    title: "Path Through the Pines",
    description:
      "An old forest trail at first light. The trees were so dense I could barely hear my own footsteps.",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",
    tags: ["forest", "nature", "landscape"],
    authorIndex: 3,
  },
  {
    title: "Ocean Curl",
    description:
      "Caught the wave right before it broke. 1/2000s, f/4, salt spray on the lens.",
    imageUrl:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80",
    tags: ["ocean", "nature", "abstract"],
    authorIndex: 3,
  },
  {
    title: "Hidden Waterfall",
    description: "A 4-second exposure of a waterfall I almost didn't climb down to.",
    imageUrl:
      "https://images.unsplash.com/photo-1433086966358-54859d0ed7df?w=1200&q=80",
    tags: ["forest", "nature", "landscape"],
    authorIndex: 3,
  },
  {
    title: "Cathedral of Trees",
    description:
      "Old growth forest, fog rolling through the trunks. Shot at 35mm to feel the depth.",
    imageUrl:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80",
    tags: ["forest", "nature", "landscape"],
    authorIndex: 3,
  },

  // nora_pixel — architecture, urban geometry
  {
    title: "White on White",
    description:
      "A study in negative space. Architecture as sculpture, light as material.",
    imageUrl:
      "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?w=1200&q=80",
    tags: ["architecture", "abstract", "urban"],
    authorIndex: 4,
  },
  {
    title: "Modern Facade",
    description: "Repeating forms, hard shadows. The building does the work.",
    imageUrl:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80",
    tags: ["architecture", "urban", "abstract"],
    authorIndex: 4,
  },
  {
    title: "Skyline, Soft Light",
    description:
      "A city breathing at dusk. Every window a small story I'll never know.",
    imageUrl:
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=80",
    tags: ["architecture", "city", "urban"],
    authorIndex: 4,
  },
  {
    title: "Green Hills, Quiet Light",
    description: "Rolling hills outside the city. The slow life, in focus.",
    imageUrl:
      "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=1200&q=80",
    tags: ["landscape", "nature", "abstract"],
    authorIndex: 4,
  },
]

const COMMENT_TEMPLATES = [
  "Stunning composition — the light is perfect.",
  "Wow, this is breathtaking. Following you now.",
  "Love the mood here. How did you process it?",
  "Colors (or the absence of them) are unreal.",
  "This belongs in a gallery.",
  "The detail in the shadows is incredible.",
  "Did you shoot this on film or digital?",
  "Instant favorite. Saved to my inspiration board.",
  "I've been to this exact spot — your photo does it justice.",
  "The tones here are pure poetry.",
]

export async function runSeed() {
  console.log("[seed] cleaning existing data…")
  // delete in dependency order to respect foreign keys
  await db.like.deleteMany()
  await db.comment.deleteMany()
  await db.taggedPhoto.deleteMany()
  await db.follow.deleteMany()
  await db.photo.deleteMany()
  await db.tag.deleteMany()
  await db.user.deleteMany()

  console.log("[seed] creating users…")
  const users = await Promise.all(
    USERS.map(async (u) => {
      const passwordHash = await bcrypt.hash(u.password, 10)
      return db.user.create({
        data: {
          username: u.username,
          email: u.email,
          passwordHash,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
        },
      })
    })
  )
  console.log(`[seed] ${users.length} users created`)

  console.log("[seed] creating photos…")
  const photos = []
  for (const p of PHOTOS) {
    const author = users[p.authorIndex]
    // upsert tag records so we can attach them
    const tagRecords = await Promise.all(
      p.tags.map(async (t) => {
        return db.tag.upsert({
          where: { name: t },
          update: {},
          create: { name: t },
        })
      })
    )
    // stagger createdAt across the past two weeks so "newest" sort looks real
    const offset = photos.length * 6 * 60 * 60 * 1000 // 6h between uploads
    const createdAt = new Date(Date.now() - offset)
    const photo = await db.photo.create({
      data: {
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        authorId: author.id,
        createdAt,
        tags: {
          create: tagRecords.map((t) => ({ tagId: t.id })),
        },
      },
    })
    photos.push(photo)
  }
  console.log(`[seed] ${photos.length} photos created`)

  console.log("[seed] adding likes…")
  let likeCount = 0
  for (const photo of photos) {
    // randomly choose 2-4 users (other than the author) to like
    const candidates = users.filter((u) => u.id !== photo.authorId)
    const shuffled = [...candidates].sort(() => Math.random() - 0.5)
    const likers = shuffled.slice(0, 2 + Math.floor(Math.random() * 3))
    for (const liker of likers) {
      await db.like.create({
        data: { userId: liker.id, photoId: photo.id },
      })
      likeCount++
    }
  }
  console.log(`[seed] ${likeCount} likes created`)

  console.log("[seed] adding comments…")
  let commentCount = 0
  for (const photo of photos) {
    const candidates = users.filter((u) => u.id !== photo.authorId)
    // 0-2 comments per photo
    const numComments = Math.floor(Math.random() * 3)
    for (let i = 0; i < numComments; i++) {
      const author = candidates[Math.floor(Math.random() * candidates.length)]
      const body = COMMENT_TEMPLATES[Math.floor(Math.random() * COMMENT_TEMPLATES.length)]
      await db.comment.create({
        data: {
          body,
          authorId: author.id,
          photoId: photo.id,
          createdAt: new Date(
            photo.createdAt.getTime() +
              Math.floor(Math.random() * 6 * 24 * 60 * 60 * 1000)
          ),
        },
      })
      commentCount++
    }
  }
  console.log(`[seed] ${commentCount} comments created`)

  console.log("[seed] adding follows…")
  let followCount = 0
  // Specific relationships so the Feed tab has interesting content:
  //   mara follows duke
  //   duke follows aiko
  //   aiko follows leo
  //   leo follows nora
  //   nora follows mara
  // Plus each user follows 1-2 more random users for variety.
  const curated: [number, number][] = [
    [0, 1], // mara -> duke
    [1, 2], // duke -> aiko
    [2, 3], // aiko -> leo
    [3, 4], // leo -> nora
    [4, 0], // nora -> mara
  ]
  for (const [a, b] of curated) {
    await db.follow.create({
      data: { followerId: users[a].id, followingId: users[b].id },
    })
    followCount++
  }
  for (let i = 0; i < users.length; i++) {
    const targets = users.filter((_, idx) => idx !== i)
    const shuffled = [...targets].sort(() => Math.random() - 0.5)
    const extra = shuffled.slice(0, 1 + Math.floor(Math.random() * 2))
    for (const t of extra) {
      // skip if already following (curated pairs)
      const exists = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: users[i].id,
            followingId: t.id,
          },
        },
      })
      if (exists) continue
      await db.follow.create({
        data: { followerId: users[i].id, followingId: t.id },
      })
      followCount++
    }
  }
  console.log(`[seed] ${followCount} follows created`)

  console.log("[seed] done ✓")
  return {
    users: users.length,
    photos: photos.length,
    likes: likeCount,
    comments: commentCount,
    follows: followCount,
  }
}

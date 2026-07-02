// Upload adult photos of Caterina Balivo (legs, glamour) as isAdult=true in Nude category
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const ADULT_PHOTOS = [
  { url: 'https://sfile.chatglm.cn/images-ppt/2ba24c9026dc.jpg', title: 'Caterina Balivo — Gambe eleganti', desc: 'Scatto glamour di Caterina Balivo, gambe eleganti in abito.', tags: ['caterina-balivo', 'gambe', 'glamour', 'elegante'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/f6d2375822cd.jpg', title: 'Caterina Balivo — Cosce e stile', desc: 'Caterina Balivo in uno scatto che mette in risalto le cosce e lo stile.', tags: ['caterina-balivo', 'cosce', 'stile', 'glamour'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/0da128adee55.jpg', title: 'Caterina Balivo — Lifestyle glam', desc: 'Caterina Balivo in un contesto lifestyle glamour.', tags: ['caterina-balivo', 'lifestyle', 'glamour', 'gambe'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/eece2d132b1c.jpg', title: 'Caterina Balivo — Pose elegante', desc: 'Pose elegante di Caterina Balivo, gambe a riposo.', tags: ['caterina-balivo', 'pose', 'elegante', 'gambe'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/4ef3103f2643.jpg', title: 'Caterina Balivo — Dress e cosce', desc: 'Caterina Balivo in abito che evidenzia le cosce.', tags: ['caterina-balivo', 'dress', 'cosce', 'moda'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/0683a009dc91.jpg', title: 'Caterina Balivo — Seduta glamour', desc: 'Caterina Balivo seduta in uno scatto glamour.', tags: ['caterina-balivo', 'seduta', 'glamour', 'gambe'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/7898b0b9ebe1.jpg', title: 'Caterina Balivo — Legs show', desc: 'Caterina Balivo in uno scatto che valorizza le gambe.', tags: ['caterina-balivo', 'legs', 'gambe', 'glamour'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/22cb50e96caf.jpg', title: 'Caterina Balivo — Glamour full', desc: 'Scatto glamour full body di Caterina Balivo.', tags: ['caterina-balivo', 'glamour', 'full-body', 'gambe'] },
];

async function main() {
  // Get Nude category
  const nudeCat = await db.category.findUnique({ where: { slug: 'nude' } });
  if (!nudeCat) throw new Error('Nude category not found');

  // Get all users for distribution
  const users = await db.user.findMany();
  const userMap = {};
  users.forEach(u => userMap[u.username] = u.id);

  // Distribute photos among different users
  const authors = ['fan_balivo', 'mara_lens', 'duke_bw', 'aiko_frames', 'leo_exposure', 'nora_pixel', 'adriano'];

  let count = 0;
  for (let i = 0; i < ADULT_PHOTOS.length; i++) {
    const p = ADULT_PHOTOS[i];
    const author = authors[i % authors.length];
    const authorId = userMap[author];
    if (!authorId) continue;

    // Skip if already exists
    const existing = await db.photo.findFirst({ where: { imageUrl: p.url } });
    if (existing) {
      console.log(`  ⏭  Skipped: ${p.title}`);
      continue;
    }

    const photo = await db.photo.create({
      data: {
        title: p.title,
        description: p.desc,
        imageUrl: p.url,
        authorId,
        categoryId: nudeCat.id,
        isAdult: true,
      },
    });

    // Add tags
    for (const t of p.tags) {
      const tag = await db.tag.upsert({ where: { name: t }, update: {}, create: { name: t } });
      await db.taggedPhoto.create({ data: { photoId: photo.id, tagId: tag.id } }).catch(() => {});
    }

    count++;
    console.log(`  ✓ ${p.title} (by ${author}, isAdult: true)`);
  }

  // Add some likes and comments to adult photos
  const adultPhotos = await db.photo.findMany({ where: { isAdult: true } });
  let likeCount = 0, commentCount = 0;
  const comments = ['Stunning legs!', 'Beautiful shot', 'Very elegant', 'Love the pose', 'Amazing glamour', 'Great composition'];

  for (const photo of adultPhotos) {
    const others = Object.values(userMap).filter(id => id !== photo.authorId);
    const likers = others.sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
    for (const uid of likers) {
      try { await db.like.create({ data: { userId: uid, photoId: photo.id } }); likeCount++ } catch {}
    }
    const commenters = others.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 2));
    for (const uid of commenters) {
      try {
        await db.comment.create({ data: { body: comments[Math.floor(Math.random() * comments.length)], authorId: uid, photoId: photo.id } });
        commentCount++;
      } catch {}
    }
  }

  console.log(`\n✓ ${count} adult photos uploaded`);
  console.log(`✓ ${likeCount} likes, ${commentCount} comments added`);

  // Summary
  const totals = {
    totalPhotos: await db.photo.count(),
    adultPhotos: await db.photo.count({ where: { isAdult: true } }),
    totalUsers: await db.user.count(),
    categories: await db.category.count(),
    adultCategories: await db.category.count({ where: { isAdult: true } }),
  };
  console.log('\n📊 TOTALS:');
  Object.entries(totals).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect());

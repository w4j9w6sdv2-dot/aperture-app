// Register demo users + upload Caterina Balivo photos
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();

const CATERINA_PHOTOS = [
  { url: 'https://sfile.chatglm.cn/images-ppt/2e5fd92dde89.jpg', title: 'Caterina Balivo — Ritratto editoriale', desc: 'Ritratto elegante di Caterina Balivo, conduttrice televisiva italiana.', tags: ['caterina-balivo', 'ritratto', 'televisione'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/8e9483dc9ee7.jpg', title: 'Caterina Balivo — Intervista', desc: 'Caterina Balivo durante un\'intervista televisiva.', tags: ['caterina-balivo', 'intervista', 'tv'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/8d0621e0ffea.jpg', title: 'Caterina Balivo — Evento', desc: 'Caterina Balivo a un evento pubblico.', tags: ['caterina-balivo', 'evento', 'elegant'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/3107241f560d.jpg', title: 'Caterina Balivo — Studio', desc: 'Scatto in studio di Caterina Balivo.', tags: ['caterina-balivo', 'studio', 'professionale'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/77383112e968.jpg', title: 'Caterina Balivo — Portraits', desc: 'Sessione ritrattistica di Caterina Balivo.', tags: ['caterina-balivo', 'portrait', 'moda'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/9b4c9edafb96.jpg', title: 'Caterina Balivo — La Volta Buona', desc: 'Caterina Balivo sul set del suo programma La Volta Buona.', tags: ['caterina-balivo', 'la-volta-buona', 'rai'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/a33a6ef923e7.jpg', title: 'Caterina Balivo — Photocall', desc: 'Caterina Balivo durante un photocall.', tags: ['caterina-balivo', 'photocall', 'evento'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/5feb3e7d2eeb.jpg', title: 'Caterina Balivo — Magazine', desc: 'Caterina Balivo in copertina magazine.', tags: ['caterina-balivo', 'magazine', 'cover'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/74b2d3960da3.jpg', title: 'Caterina Balivo — Lifestyle', desc: 'Caterina Balivo in uno scatto lifestyle.', tags: ['caterina-balivo', 'lifestyle', 'natural'] },
  { url: 'https://sfile.chatglm.cn/images-ppt/4766d9c855b3.jpg', title: 'Caterina Balivo — Huffpost', desc: 'Caterina Balivo intervistata da HuffPost.', tags: ['caterina-balivo', 'huffpost', 'intervista'] },
];

const USERS = [
  { username: 'adriano', email: 'adriano@aperture.app', bio: 'Founder of Aperture. Developer, dreamer, creator.', avatar: 'https://i.pravatar.cc/300?u=adriano' },
  { username: 'mara_lens', email: 'mara_lens@demo.com', bio: 'Landscape photographer from the Dolomites.', avatar: 'https://i.pravatar.cc/300?u=mara_lens' },
  { username: 'duke_bw', email: 'duke_bw@demo.com', bio: 'B&W street photographer from NYC.', avatar: 'https://i.pravatar.cc/300?u=duke_bw' },
  { username: 'aiko_frames', email: 'aiko_frames@demo.com', bio: 'Portrait photographer from Tokyo.', avatar: 'https://i.pravatar.cc/300?u=aiko_frames' },
  { username: 'leo_exposure', email: 'leo_exposure@demo.com', bio: 'Architecture photographer from Berlin.', avatar: 'https://i.pravatar.cc/300?u=leo_exposure' },
  { username: 'nora_pixel', email: 'nora_pixel@demo.com', bio: 'Macro photographer from Amsterdam.', avatar: 'https://i.pravatar.cc/300?u=nora_pixel' },
  { username: 'fan_balivo', email: 'fan_balivo@demo.com', bio: 'Appassionato di fotografia e televisione italiana.', avatar: 'https://i.pravatar.cc/300?u=fan_balivo' },
];

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create categories if they don't exist
  const categories = [
    { name: 'Landscapes', slug: 'landscapes', icon: 'Mountain' },
    { name: 'Portraits', slug: 'portraits', icon: 'User' },
    { name: 'Street', slug: 'street', icon: 'Camera' },
    { name: 'Architecture', slug: 'architecture', icon: 'Building' },
    { name: 'Nature', slug: 'nature', icon: 'Leaf' },
    { name: 'Macro', slug: 'macro', icon: 'ZoomIn' },
    { name: 'Black & White', slug: 'bw', icon: 'Contrast' },
    { name: 'Travel', slug: 'travel', icon: 'Plane' },
  ];
  const catMap = {};
  for (const c of categories) {
    const cat = await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    catMap[c.slug] = cat.id;
  }
  console.log(`✓ ${Object.keys(catMap).length} categories`);

  // Create users
  const userMap = {};
  for (const u of USERS) {
    const existing = await db.user.findUnique({ where: { email: u.email } });
    if (existing) {
      userMap[u.username] = existing.id;
      console.log(`  ✓ ${u.username} already exists`);
    } else {
      const user = await db.user.create({
        data: { username: u.username, email: u.email, passwordHash, bio: u.bio, avatarUrl: u.avatar },
      });
      userMap[u.username] = user.id;
      console.log(`  ✓ ${u.username} created`);
    }
  }
  console.log(`✓ ${Object.keys(userMap).length} users`);

  // Upload Caterina Balivo photos as fan_balivo
  const caterinaAuthor = userMap['fan_balivo'];
  let photoCount = 0;
  for (const p of CATERINA_PHOTOS) {
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
        authorId: caterinaAuthor,
        categoryId: catMap['portraits'],
      },
    });
    for (const t of p.tags) {
      const tag = await db.tag.upsert({ where: { name: t }, update: {}, create: { name: t } });
      await db.taggedPhoto.create({ data: { photoId: photo.id, tagId: tag.id } }).catch(() => {});
    }
    photoCount++;
    console.log(`  ✓ ${p.title}`);
  }
  console.log(`✓ ${photoCount} Caterina Balivo photos uploaded`);

  // Add some likes and comments between users
  const allPhotos = await db.photo.findMany();
  const allUserIds = Object.values(userMap);
  let likeCount = 0, commentCount = 0;
  const comments = ['Stunning!', 'Beautiful shot', 'Great composition', 'Love this', 'Amazing work', 'Perfect capture'];

  for (const photo of allPhotos) {
    const others = allUserIds.filter((id) => id !== photo.authorId);
    const likers = others.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3));
    for (const uid of likers) {
      try { await db.like.create({ data: { userId: uid, photoId: photo.id } }); likeCount++ } catch {}
    }
    const commenters = others.sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 2));
    for (const uid of commenters) {
      try {
        await db.comment.create({ data: { body: comments[Math.floor(Math.random() * comments.length)], authorId: uid, photoId: photo.id } });
        commentCount++;
      } catch {}
    }
  }
  console.log(`✓ ${likeCount} likes, ${commentCount} comments`);

  // Follows
  const follows = [
    ['adriano', 'fan_balivo'], ['adriano', 'mara_lens'], ['adriano', 'duke_bw'],
    ['mara_lens', 'aiko_frames'], ['duke_bw', 'leo_exposure'],
    ['aiko_frames', 'nora_pixel'], ['leo_exposure', 'fan_balivo'],
    ['nora_pixel', 'mara_lens'], ['fan_balivo', 'adriano'],
  ];
  let followCount = 0;
  for (const [a, b] of follows) {
    try { await db.follow.create({ data: { followerId: userMap[a], followingId: userMap[b] } }); followCount++ } catch {}
  }
  console.log(`✓ ${followCount} follows`);

  // Mark some photos as editor picks
  const editorPicks = await db.photo.findMany({ take: 3 });
  for (const p of editorPicks) {
    await db.photo.update({ where: { id: p.id }, data: { isEditorPick: true } });
  }
  console.log(`✓ ${editorPicks.length} editor picks`);

  // Summary
  const totals = {
    users: await db.user.count(),
    photos: await db.photo.count(),
    likes: await db.like.count(),
    comments: await db.comment.count(),
    follows: await db.follow.count(),
    tags: await db.tag.count(),
    categories: await db.category.count(),
    editorPicks: await db.photo.count({ where: { isEditorPick: true } }),
  };
  console.log('\n📊 TOTALS:');
  Object.entries(totals).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\n--- LOGIN CREDENTIALS ---');
  console.log('All users: password123');
  USERS.forEach(u => console.log(`  ${u.username}: ${u.email}`));
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect());

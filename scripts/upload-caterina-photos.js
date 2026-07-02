// Insert photos directly into Aperture DB for user "adriano"
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const ADRIANO_ID = 'cmr2l6btj0000ma5neww2dx5w';

// Photos from image-search (Caterina Balivo)
const photos = [
  {
    imageUrl: 'https://sfile.chatglm.cn/images-ppt/4766d9c855b3.jpg',
    title: 'Caterina Balivo — Intervista HuffPost',
    description: 'Intervista doppia con Caterina Balivo e Diletta Leotta pubblicata da HuffPost Italia. Una conversazione tra due volti noti della televisione italiana.',
    tags: ['caterina-balivo', 'intervista', 'televisione', 'italia'],
  },
  {
    imageUrl: 'https://sfile.chatglm.cn/images-ppt/eccfb10928c6.jpg',
    title: 'Caterina Balivo — Ritratto editoriale',
    description: 'Ritratto editoriale di Caterina Balivo con camicia bianca e gonna nera su sfondo floreale. Immagine pubblicata da Leggo.',
    tags: ['caterina-balivo', 'ritratto', 'moda', 'editoriale'],
  },
  {
    imageUrl: 'https://sfile.chatglm.cn/images-ppt/4f979a0d4c4a.jpg',
    title: 'Caterina Balivo — Su sfondo viola',
    description: 'Caterina Balivo con capelli scuri ondulati e top a pois su sfondo viola. Immagine promozionale da MovieTele.',
    tags: ['caterina-balivo', 'ritratto', 'televisione', 'promozionale'],
  },
  {
    imageUrl: 'https://sfile.chatglm.cn/images-ppt/faec8f28884c.jpg',
    title: 'Caterina Balivo — Sul divano arancione',
    description: 'Caterina Balivo sorridente con capelli scuri ondulati, in abito nero, seduta su un divano arancione. Scatto per Lifestyle Blog.',
    tags: ['caterina-balivo', 'ritratto', 'televisione', 'sorriso'],
  },
  {
    imageUrl: 'https://sfile.chatglm.cn/images-ppt/d0ffc8409439.jpg',
    title: 'Caterina Balivo — Top rosso',
    description: 'Caterina Balivo sorridente con capelli castani ondulati, indossa un top rosso e gioielli dorati. Scatto per DiLei.',
    tags: ['caterina-balivo', 'ritratto', 'moda', 'elegante'],
  },
  {
    imageUrl: 'https://sfile.chatglm.cn/images-ppt/97eec364a07e.jpg',
    title: 'Caterina Balivo — La Volta Buona',
    description: 'Caterina Balivo in pigiama rosa su sfondo rosa con la scritta "LA VOLTA BUONA", il suo programma su Rai 1.',
    tags: ['caterina-balivo', 'rai', 'la-volta-buona', 'televisione'],
  },
  {
    imageUrl: 'https://sfile.chatglm.cn/images-ppt/cbb0650b8158.jpg',
    title: 'Caterina Balivo — Ospiti sul divano',
    description: 'Schermata divisa con una donna bionda in giacca rosa e una donna in abito stampato sul divano arancione di Caterina Balivo. Scatto da Fanpage.',
    tags: ['caterina-balivo', 'ospiti', 'televisione', 'la-volta-buona'],
  },
  {
    imageUrl: 'https://sfile.chatglm.cn/images-ppt/370016ff7be6.jpg',
    title: 'Caterina Balivo — Giacca di jeans',
    description: 'Caterina Balivo sorridente con lunghi capelli castani, indossa una giacca di jeans su sfondo arancione. Scatto per CasertaNews.',
    tags: ['caterina-balivo', 'ritratto', 'casual', 'sorriso'],
  },
];

(async () => {
  try {
    console.log(`Uploading ${photos.length} photos for user adriano (${ADRIANO_ID})...`);

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: ADRIANO_ID } });
    if (!user) {
      throw new Error(`User with id ${ADRIANO_ID} not found`);
    }
    console.log(`✓ User found: ${user.username} (${user.email})`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const p of photos) {
      // Skip if a photo with same title already exists for this author
      const existing = await db.photo.findFirst({
        where: { title: p.title, authorId: ADRIANO_ID },
      });
      if (existing) {
        console.log(`  ⏭  Skipped (already exists): "${p.title}"`);
        skippedCount++;
        continue;
      }

      // Create photo
      const photo = await db.photo.create({
        data: {
          title: p.title,
          description: p.description,
          imageUrl: p.imageUrl,
          authorId: ADRIANO_ID,
        },
      });

      // Create or attach tags
      for (const tagName of p.tags) {
        const tag = await db.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
        await db.taggedPhoto.create({
          data: { photoId: photo.id, tagId: tag.id },
        }).catch(() => {}); // ignore unique constraint violations
      }

      console.log(`  ✓ Created: "${p.title}" (${p.tags.length} tags)`);
      createdCount++;
    }

    console.log(`\n✅ Done! Created: ${createdCount}, Skipped: ${skippedCount}`);

    // Final summary
    const totalPhotos = await db.photo.count({ where: { authorId: ADRIANO_ID } });
    const totalTags = await db.tag.count();
    console.log(`\n📊 Adriano's totals:`);
    console.log(`  Photos: ${totalPhotos}`);
    console.log(`  Tags in DB: ${totalTags}`);
  } catch (e) {
    console.error('ERR:', e.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
})();

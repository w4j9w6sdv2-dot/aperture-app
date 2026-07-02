// Add Nude category
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    const cat = await db.category.upsert({
      where: { slug: 'nude' },
      update: {},
      create: { name: 'Nude', slug: 'nude', icon: 'Eye' },
    });
    console.log('✓ Category created/found:', cat.name, '(slug:', cat.slug + ')');

    const all = await db.category.findMany({ orderBy: { name: 'asc' } });
    console.log('\nAll categories:');
    all.forEach((c) => console.log(`  • ${c.name} (${c.slug})`));
  } catch (e) {
    console.error('ERR:', e.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
})();

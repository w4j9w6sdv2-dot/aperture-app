// Quick DB inspector
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    const users = await db.user.findMany({
      select: { username: true, email: true, createdAt: true, _count: { select: { photos: true, likes: true, comments: true, following: true } } },
      orderBy: { createdAt: 'asc' }
    });
    console.log(`\n=== ${users.length} USERS ===`);
    users.forEach(u => {
      console.log(`  • ${u.username.padEnd(15)} ${u.email.padEnd(28)} photos=${u._count.photos} likes=${u._count.likes} comments=${u._count.comments} following=${u._count.following}`);
    });

    const [photos, likes, comments, follows, tags] = await Promise.all([
      db.photo.count(),
      db.like.count(),
      db.comment.count(),
      db.follow.count(),
      db.tag.count()
    ]);
    console.log(`\n=== TOTALS ===`);
    console.log(`  Photos:    ${photos}`);
    console.log(`  Likes:     ${likes}`);
    console.log(`  Comments:  ${comments}`);
    console.log(`  Follows:   ${follows}`);
    console.log(`  Tags:      ${tags}`);
  } catch (e) {
    console.error('ERR:', e.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
})();

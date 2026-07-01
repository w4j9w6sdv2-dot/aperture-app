// Wipe all data from the database (demo users, photos, etc.)
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    console.log('🧹 Deleting all data...');

    const [likes, comments, follows, taggedPhotos, tags, photos, users] = await Promise.all([
      db.like.deleteMany(),
      db.comment.deleteMany(),
      db.follow.deleteMany(),
      db.taggedPhoto.deleteMany(),
      db.tag.deleteMany(),
      db.photo.deleteMany(),
      db.user.deleteMany(),
    ]);

    console.log('✅ All data deleted:');
    console.log(`  Likes:        ${likes.count}`);
    console.log(`  Comments:     ${comments.count}`);
    console.log(`  Follows:      ${follows.count}`);
    console.log(`  TaggedPhotos: ${taggedPhotos.count}`);
    console.log(`  Tags:         ${tags.count}`);
    console.log(`  Photos:       ${photos.count}`);
    console.log(`  Users:        ${users.count}`);

    // Verify
    const remaining = await db.user.count();
    console.log(`\nRemaining users: ${remaining}`);
  } catch (e) {
    console.error('ERR:', e.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
})();

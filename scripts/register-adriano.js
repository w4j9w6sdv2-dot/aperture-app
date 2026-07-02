// Register Adriano's account directly in the database
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

const USERNAME = 'adriano';
const EMAIL = 'adriano@aperture.app';
const PASSWORD = 'Aperture2026!';

(async () => {
  try {
    console.log('Creating account for Adriano...');
    console.log(`  Username: ${USERNAME}`);
    console.log(`  Email:    ${EMAIL}`);

    // Check if already exists
    const existing = await db.user.findFirst({
      where: {
        OR: [{ username: USERNAME }, { email: EMAIL }],
      },
    });

    if (existing) {
      console.log('⚠️  Account already exists:');
      console.log(`  id: ${existing.id}`);
      console.log(`  username: ${existing.username}`);
      console.log(`  email: ${existing.email}`);
      return;
    }

    // Hash password with bcrypt (10 rounds, same as NextAuth credentials provider)
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    // Create user
    const user = await db.user.create({
      data: {
        username: USERNAME,
        email: EMAIL,
        passwordHash,
        bio: 'Founder of Aperture. Non-hearing developer with spastic paresis. Built this platform so every person — regardless of ability — can share their vision of the world.',
      },
    });

    console.log('\n✅ Account created successfully:');
    console.log(`  id:           ${user.id}`);
    console.log(`  username:     ${user.username}`);
    console.log(`  email:        ${user.email}`);
    console.log(`  bio:          ${user.bio}`);
    console.log(`  createdAt:    ${user.createdAt.toISOString()}`);
    console.log('\n--- LOGIN CREDENTIALS ---');
    console.log(`  URL:      https://aperture-blush.vercel.app`);
    console.log(`  Username: ${USERNAME}  (or email: ${EMAIL})`);
    console.log(`  Password: ${PASSWORD}`);
  } catch (e) {
    console.error('ERR:', e.message);
    if (e.code === 'P2002') {
      console.error('Username or email already taken');
    }
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
})();

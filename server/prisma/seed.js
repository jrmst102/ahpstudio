/**
 * Seed script – creates the initial admin user in DigitalOcean Spaces.
 * Run once: node prisma/seed.js   (from the server/ directory)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const userService = require('../src/services/userService');

async function main() {
  console.log('Initialising data store on DigitalOcean Spaces...');

  const existing = await userService.findUserByUsername('admin');
  if (existing) {
    console.log('Admin user already exists – skipping.');
    return;
  }

  await userService.createUser({
    username: 'admin',
    email: 'admin@ahpstudio.com',
    password: 'AHPAdmin2026!',
    fullName: 'System Administrator',
    role: 'ADMIN',
  });

  console.log('Created admin user:');
  console.log('  Username: admin');
  console.log('  Password: AHPAdmin2026!');
  console.log('  ⚠  CHANGE THIS PASSWORD ON FIRST LOGIN!');
}

main().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

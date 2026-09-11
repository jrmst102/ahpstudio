/**
 * Seed script – creates the initial admin user in DigitalOcean Spaces.
 * Run once: node prisma/seed.js   (from the server/ directory)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const userService = require('../src/services/userService');

const SEED_USERS = [
  {
    username: 'admin',
    email: 'admin@ahpstudio.com',
    password: 'AHPAdmin2026!',
    fullName: 'System Administrator',
    role: 'ADMIN',
    note: 'CHANGE THIS PASSWORD ON FIRST LOGIN!',
  },
  {
    username: 'demo_admin',
    email: 'demo.admin@ahpstudio.com',
    password: 'DemoUser2026!',
    fullName: 'Demo Administrator',
    role: 'ADMIN',
  },
  {
    username: 'demo_alex',
    email: 'demo.alex@ahpstudio.com',
    password: 'DemoUser2026!',
    fullName: 'Alex Rivera',
    role: 'STUDENT',
  },
  {
    username: 'demo_bailey',
    email: 'demo.bailey@ahpstudio.com',
    password: 'DemoUser2026!',
    fullName: 'Bailey Chen',
    role: 'STUDENT',
  },
  {
    username: 'demo_casey',
    email: 'demo.casey@ahpstudio.com',
    password: 'DemoUser2026!',
    fullName: 'Casey Morgan',
    role: 'STUDENT',
  },
];

async function createUserIfMissing(userData) {
  const existing = await userService.findUserByUsername(userData.username);
  if (existing) {
    console.log(`User already exists: ${userData.username} - skipping.`);
    return false;
  }

  await userService.createUser(userData);
  console.log(`Created user: ${userData.username}`);
  console.log(`  Password: ${userData.password}`);
  if (userData.note) {
    console.log(`  ${userData.note}`);
  }
  return true;
}

async function main() {
  console.log('Initialising data store on DigitalOcean Spaces...');

  let createdCount = 0;
  for (const userData of SEED_USERS) {
    const created = await createUserIfMissing(userData);
    if (created) createdCount += 1;
  }

  console.log(`Seed complete. Created ${createdCount} user(s).`);
}

main().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

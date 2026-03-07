const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('AHPAdmin2026!', 12);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@ahpstudio.com',
      passwordHash: hashedPassword,
      fullName: 'System Administrator',
      role: 'ADMIN',
    },
  });

  console.log('Created admin user:', admin.username);
  console.log('Default password: AHPAdmin2026!');
  console.log('IMPORTANT: Change this password on first login!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

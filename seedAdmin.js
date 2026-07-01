import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  let email = args[0];
  let password = args[1];
  let role = args[2] || 'admin';

  if (!email || !password) {
    console.log('No credentials provided in command line arguments.');
    console.log('Usage: node seedAdmin.js <email> <password> [role]');
    console.log('Using default admin setup instead...\n');
    email = 'admin2@eonassetsmining.com';
    password = 'adminpassword123';
  }

  console.log(`Creating admin with:`);
  console.log(`- Email: ${email}`);
  console.log(`- Role: ${role}`);

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admins.upsert({
    where: { email },
    update: {
      password_hash: passwordHash,
      role: role
    },
    create: {
      email,
      password_hash: passwordHash,
      role: role
    },
  });

  console.log('\nAdmin created/updated successfully!');
  console.log(`Admin ID: ${admin.id}`);
  console.log(`Email: ${admin.email}`);
  console.log(`Password: ${password}`);
  console.log(`Role: ${admin.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

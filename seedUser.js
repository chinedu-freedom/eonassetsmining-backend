import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding a test user...');

  // 1. Get default country and language
  const country = await prisma.countries.findFirst({ where: { country_code: 'US' } });
  const language = await prisma.languages.findFirst({ where: { language_code: 'en' } });

  if (!country || !language) {
    throw new Error('Default country or language missing. Please run seed.js or populate_countries.js first.');
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const fullName = 'John Doe';
  
  // Generate unique referral code
  const prefix = fullName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'EON');
  const referralCode = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;

  const user = await prisma.users.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password_hash: passwordHash,
      full_name: fullName,
      username: 'johndoe',
      country_id: country.id,
      language_id: language.id,
      referral_code: referralCode,
      balance: 1500.50, // Give them some balance so it looks good on the dashboard
      withdrawable_balance: 50.00,
      gift_balance: 0.00
    },
  });

  console.log('Test user created successfully!');
  console.log(`Email: ${user.email}`);
  console.log(`Password: password123`);
  console.log(`Full Name: ${user.full_name}`);
  console.log(`Country ID: ${user.country_id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

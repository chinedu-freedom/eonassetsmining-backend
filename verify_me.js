import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.users.updateMany({
    where: {},
    data: { email_verified: true }
  });
  console.log(`Updated ${result.count} users.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

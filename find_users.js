import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      full_name: true
    },
    take: 5
  });
  console.log("Users in database:");
  console.log(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());

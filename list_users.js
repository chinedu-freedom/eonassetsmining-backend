import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    select: {
      email: true,
      username: true,
      full_name: true,
      created_at: true
    }
  });
  console.log(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());

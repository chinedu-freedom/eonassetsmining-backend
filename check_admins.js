import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all registered admins...");
  const admins = await prisma.admins.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      created_at: true
    }
  });
  console.log("Total Admins found:", admins.length);
  console.log(JSON.stringify(admins, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

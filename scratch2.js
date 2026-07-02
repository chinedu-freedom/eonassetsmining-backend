import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const deposits = await prisma.deposits.findMany({
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log(deposits);
}

main().finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transactions.findMany({
    where: {
      OR: [
        { description: { contains: 'Welcome', mode: 'insensitive' } },
        { description: { contains: 'migration', mode: 'insensitive' } },
        { type: { contains: 'Welcome', mode: 'insensitive' } },
        { type: { contains: 'migration', mode: 'insensitive' } }
      ]
    },
    take: 50
  });
  console.log(JSON.stringify(txs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

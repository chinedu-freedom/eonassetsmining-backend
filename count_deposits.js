import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.deposits.count({ where: { status: 'PENDING' } });
  const approved = await prisma.deposits.count({ where: { status: 'APPROVED' } });
  const rejected = await prisma.deposits.count({ where: { status: 'REJECTED' } });

  console.log(`\n--- DEPOSIT COUNTS ---`);
  console.log(`Pending: ${pending}`);
  console.log(`Approved: ${approved}`);
  console.log(`Rejected: ${rejected}`);
  console.log(`Total: ${pending + approved + rejected}\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

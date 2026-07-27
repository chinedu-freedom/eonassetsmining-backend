import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({});
  console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email, balance: u.balance, withdrawable: u.withdrawable_balance })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

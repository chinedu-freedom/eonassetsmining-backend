import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("=== USER BALANCES ===");
  const users = await prisma.users.findMany({
    select: { id: true, email: true, balance: true }
  });
  console.table(users);
  
  const totalBalance = users.reduce((acc, user) => acc + (user.balance || 0), 0);
  console.log("Total Balance Sum: ", totalBalance);

  console.log("\n=== DEPOSITS ===");
  const deposits = await prisma.deposits.findMany({
    select: { id: true, status: true, amount: true, created_at: true }
  });
  console.table(deposits);

  console.log("\n=== WITHDRAWALS ===");
  const withdrawals = await prisma.withdrawals.findMany({
    select: { id: true, status: true, amount: true, created_at: true }
  });
  console.table(withdrawals);

  console.log("\n=== INVESTMENTS (PLANS) ===");
  const investments = await prisma.investments.findMany({
    select: { id: true, status: true, amount: true, created_at: true }
  });
  console.table(investments);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

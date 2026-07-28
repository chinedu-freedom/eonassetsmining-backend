import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const usersToDelete = await prisma.users.findMany({
    where: {
      username: { in: ['testuser', 'Sparko'] }
    },
    select: { id: true }
  });

  const userIds = usersToDelete.map(u => u.id);

  if (userIds.length > 0) {
    console.log(`Found ${userIds.length} users. Deleting related records first...`);
    // Delete transactions
    await prisma.transactions.deleteMany({ where: { user_id: { in: userIds } } });
    // Delete withdrawals
    await prisma.withdrawals.deleteMany({ where: { user_id: { in: userIds } } });
    // Delete deposits
    await prisma.deposits.deleteMany({ where: { user_id: { in: userIds } } });
    // Delete user spins
    await prisma.user_spins.deleteMany({ where: { user_id: { in: userIds } } });
    
    try {
      await prisma.activity_logs.deleteMany({ where: { user_id: { in: userIds } } });
    } catch (e) {}

    try {
      await prisma.user_tasks.deleteMany({ where: { user_id: { in: userIds } } });
    } catch (e) {}

    // Delete users
    const result = await prisma.users.deleteMany({
      where: { id: { in: userIds } }
    });
    console.log(`Successfully deleted ${result.count} users.`);
  } else {
    console.log("No matching users (testuser, Sparko) found in the database.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

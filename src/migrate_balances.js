import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration of gift balances to withdrawable balances...');
  
  // Find all users with gift_balance > 0
  const usersToMigrate = await prisma.users.findMany({
    where: {
      gift_balance: {
        gt: 0
      }
    }
  });

  console.log(`Found ${usersToMigrate.length} users with gift_balance > 0.`);

  if (usersToMigrate.length === 0) {
    console.log('No users require migration.');
    return;
  }

  for (const user of usersToMigrate) {
    const giftVal = Number(user.gift_balance);
    const oldWithdrawable = Number(user.withdrawable_balance || 0);
    const newWithdrawable = oldWithdrawable + giftVal;

    console.log(`Migrating User ID ${user.id} (${user.email}):`);
    console.log(` - Gift Balance: ${giftVal}`);
    console.log(` - Old Withdrawable Balance: ${oldWithdrawable}`);
    console.log(` - New Withdrawable Balance: ${newWithdrawable}`);

    await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: {
          withdrawable_balance: newWithdrawable,
          gift_balance: 0
        }
      }),
      prisma.transactions.create({
        data: {
          user_id: user.id,
          type: 'gift_balance_migration',
          amount: giftVal,
          balance_before: oldWithdrawable,
          balance_after: newWithdrawable,
          description: `Migrated existing gift balance of ${giftVal} to withdrawable balance`
        }
      })
    ]);

    console.log(`Successfully migrated User ID ${user.id}.\n`);
  }

  console.log('Migration complete!');
}

main()
  .catch((e) => {
    console.error('Error during migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

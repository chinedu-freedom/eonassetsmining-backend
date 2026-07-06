import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration of welcome bonuses from deposit balance to withdrawable balance...');

  // Get all REGISTRATION_BONUS transactions
  const regTxs = await prisma.transactions.findMany({
    where: {
      type: 'REGISTRATION_BONUS'
    },
    include: {
      user: true
    }
  });

  console.log(`Found ${regTxs.length} REGISTRATION_BONUS transactions.`);

  for (const tx of regTxs) {
    const userId = tx.user_id;
    const user = tx.user;
    const amountToMigrate = Number(tx.amount);

    if (amountToMigrate <= 0) {
      console.log(`Skipping User ID ${userId} (${user.email}) because bonus amount is 0.`);
      continue;
    }

    // Check if we already migrated this user's welcome bonus
    const alreadyMigrated = await prisma.transactions.findFirst({
      where: {
        user_id: userId,
        type: 'welcome_bonus_migration'
      }
    });

    if (alreadyMigrated) {
      console.log(`User ID ${userId} (${user.email}) has already been migrated. Skipping.`);
      continue;
    }

    // Check user's current deposit balance
    const currentBalance = Number(user.balance);
    if (currentBalance < amountToMigrate) {
      console.warn(`User ID ${userId} (${user.email}) has a deposit balance of ${currentBalance}, which is less than the bonus amount ${amountToMigrate}. Migrating only the available balance.`);
    }

    const migrationAmount = Math.min(amountToMigrate, currentBalance);

    if (migrationAmount <= 0) {
      console.log(`User ID ${userId} (${user.email}) has 0 or negative deposit balance. Cannot migrate.`);
      continue;
    }

    const oldBalance = currentBalance;
    const newBalance = oldBalance - migrationAmount;
    
    const oldWithdrawable = Number(user.withdrawable_balance || 0);
    const newWithdrawable = oldWithdrawable + migrationAmount;

    console.log(`Migrating Welcome Bonus for User ID ${userId} (${user.email}):`);
    console.log(` - Migrating Amount: ${migrationAmount}`);
    console.log(` - Deposit Balance: ${oldBalance} -> ${newBalance}`);
    console.log(` - Withdrawable Balance: ${oldWithdrawable} -> ${newWithdrawable}`);

    await prisma.$transaction([
      prisma.users.update({
        where: { id: userId },
        data: {
          balance: newBalance,
          withdrawable_balance: newWithdrawable
        }
      }),
      prisma.transactions.create({
        data: {
          user_id: userId,
          type: 'welcome_bonus_migration',
          amount: migrationAmount,
          balance_before: oldWithdrawable,
          balance_after: newWithdrawable,
          description: `Migrated welcome bonus of ${migrationAmount} from deposit balance to withdrawable balance`
        }
      })
    ]);

    console.log(`Successfully migrated User ID ${userId}.\n`);
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

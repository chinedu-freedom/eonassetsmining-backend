import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking registration bonuses...');
  
  const txs = await prisma.transactions.findMany({
    where: {
      type: 'REGISTRATION_BONUS'
    },
    include: {
      user: true
    }
  });

  console.log(`Found ${txs.length} REGISTRATION_BONUS transactions.`);
  
  for (const tx of txs) {
    console.log(`User ID: ${tx.user_id}, Email: ${tx.user.email}`);
    console.log(` - Transaction Amount: ${tx.amount}`);
    console.log(` - User Current Balance: ${tx.user.balance}`);
    console.log(` - User Current Withdrawable Balance: ${tx.user.withdrawable_balance}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

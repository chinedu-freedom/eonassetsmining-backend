import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.users.findUnique({
    where: { email: 'chinedufreedom10@gmail.com' }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const currentBalance = Number(user.balance);
  const currentGiftBalance = Number(user.gift_balance);
  
  // They earned 7.00 from treasure which went to main balance.
  // Move 7.00 from main balance to gift balance.
  
  const newBalance = currentBalance - 7.00;
  const newGiftBalance = currentGiftBalance + 7.00;
  
  await prisma.users.update({
    where: { id: user.id },
    data: {
      balance: newBalance,
      gift_balance: newGiftBalance
    }
  });
  
  console.log('--- Balance Updated Successfully ---');
  console.log(`Earning Balance: ${currentBalance} -> ${newBalance}`);
  console.log(`Gift Balance: ${currentGiftBalance} -> ${newGiftBalance}`);
  console.log(`Total Balance remains: ${currentBalance + currentGiftBalance}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

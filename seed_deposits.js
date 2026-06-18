import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get a user and a payment method
  const user = await prisma.users.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }
  
  let paymentMethod = await prisma.payment_methods.findFirst();
  if (!paymentMethod) {
    // create a dummy payment method
    paymentMethod = await prisma.payment_methods.create({
      data: {
        name: "Bitcoin",
        type: "Crypto",
        min_amount: 10,
        max_amount: 100000,
        charges: 0,
        status: true,
      }
    });
  }

  // Create deposits
  await prisma.deposits.create({
    data: {
      user_id: user.id,
      amount: 500,
      payment_method_id: paymentMethod.id,
      cryptocurrency: 'BTC',
      status: 'PENDING',
    }
  });

  await prisma.deposits.create({
    data: {
      user_id: user.id,
      amount: 1200,
      payment_method_id: paymentMethod.id,
      cryptocurrency: 'BTC',
      status: 'APPROVED',
      approved_at: new Date()
    }
  });

  await prisma.deposits.create({
    data: {
      user_id: user.id,
      amount: 350,
      payment_method_id: paymentMethod.id,
      cryptocurrency: 'USDT',
      status: 'REJECTED',
      approved_at: new Date()
    }
  });

  // Create withdrawals
  await prisma.withdrawals.create({
    data: {
      user_id: user.id,
      amount: 200,
      withdrawal_method: 'BTC',
      fees: 5,
      net_amount: 195,
      wallet_address: 'bc1qdummyaddress123',
      status: 'PENDING'
    }
  });

  await prisma.withdrawals.create({
    data: {
      user_id: user.id,
      amount: 800,
      withdrawal_method: 'USDT',
      fees: 20,
      net_amount: 780,
      wallet_address: '0xdummyaddress456',
      status: 'PAID'
    }
  });

  await prisma.withdrawals.create({
    data: {
      user_id: user.id,
      amount: 150,
      withdrawal_method: 'BTC',
      fees: 3.5,
      net_amount: 146.5,
      wallet_address: 'bc1qrejected789',
      status: 'REJECTED'
    }
  });

  console.log("Mock deposits and withdrawals created!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

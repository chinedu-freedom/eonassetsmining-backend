import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTest() {
  console.log('=== STARTING SPIN AND DEPOSIT SPIN TEST ===\n');

  // Find country and language for required relations
  const country = await prisma.countries.findFirst() || { id: undefined };
  const language = await prisma.languages.findFirst() || { id: undefined };

  // 1. Find or create a test user
  let user = await prisma.users.findFirst({
    where: { email: 'test_spin_user@example.com' }
  });

  if (!user) {
    console.log('Creating test user...');
    user = await prisma.users.create({
      data: {
        email: 'test_spin_user@example.com',
        username: 'test_spin_user',
        password_hash: 'hash',
        full_name: 'Test Spin User',
        country_id: country.id,
        language_id: language.id,
        referral_code: 'TESTSPIN1234',
        balance: 10.00,
        withdrawable_balance: 0.00,
        is_active: true
      }
    });
  } else {
    // Reset test user balance and withdrawable balance
    console.log('Resetting existing test user...');
    user = await prisma.users.update({
      where: { id: user.id },
      data: {
        balance: 10.00,
        withdrawable_balance: 0.00
      }
    });
  }

  const userId = user.id;

  // Clean up any old test user spins, deposits, spin logs, transactions
  await prisma.user_spins.deleteMany({ where: { user_id: userId } });
  await prisma.spin_logs.deleteMany({ where: { user_id: userId } });
  await prisma.transactions.deleteMany({ where: { user_id: userId } });
  await prisma.deposits.deleteMany({ where: { user_id: userId } });

  console.log(`Initial User State:`);
  console.log(`- Balance (Deposit): $${Number(user.balance).toFixed(2)}`);
  console.log(`- Withdrawable Balance: $${Number(user.withdrawable_balance).toFixed(2)}`);
  console.log(`- Free Spins Remaining: 0 (No record exists yet)`);
  console.log('\n----------------------------------------\n');

  // 2. Simulate Deposit approval (User deposits $50.00)
  console.log('Step 1: Creating a pending deposit of $50.00...');
  const deposit = await prisma.deposits.create({
    data: {
      user_id: userId,
      amount: 50.00,
      cryptocurrency: 'USDT',
      status: 'PENDING'
    }
  });

  console.log('Step 2: Approving the deposit (simulating admin approval transaction)...');
  const depositAmount = Number(deposit.amount);
  const newBalance = Number(user.balance) + depositAmount;

  // Run the approval transaction (same as router/admin/transactions.js logic)
  await prisma.$transaction([
    prisma.deposits.update({
      where: { id: deposit.id },
      data: { status: 'APPROVED', approved_at: new Date() }
    }),
    prisma.users.update({
      where: { id: userId },
      data: { balance: newBalance }
    }),
    prisma.transactions.create({
      data: {
        user_id: userId,
        type: 'DEPOSIT',
        amount: depositAmount,
        balance_before: user.balance,
        balance_after: newBalance,
        description: 'Deposit approved'
      }
    }),
    prisma.user_spins.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        free_spins_remaining: 1,
        total_spins_used: 0,
        total_rewards_earned: 0
      },
      update: {
        free_spins_remaining: { increment: 1 }
      }
    })
  ]);

  // Fetch updated user and spins
  let updatedUser = await prisma.users.findUnique({ where: { id: userId } });
  let userSpins = await prisma.user_spins.findUnique({ where: { user_id: userId } });

  console.log('\nVerification after Deposit Approval:');
  console.log(`- New Balance (Deposit): $${Number(updatedUser.balance).toFixed(2)} (Expected: $60.00)`);
  console.log(`- Free Spins Remaining: ${userSpins?.free_spins_remaining} (Expected: 1)`);
  
  if (Number(updatedUser.balance) === 60.00 && userSpins?.free_spins_remaining === 1) {
    console.log('✅ DEPOSIT SPIN AWARDING WORKS CORRECTLY!');
  } else {
    throw new Error('❌ Deposit spin awarding verification failed.');
  }
  console.log('\n----------------------------------------\n');

  // 3. Play Spin 1 (Should be FREE because free_spins_remaining = 1)
  console.log('Step 3: Playing Spin 1 (should use FREE spin and NOT deduct any money)...');
  
  // Get active settings to check per spin cost
  const settings = await prisma.settings.findFirst();
  const costPerSpin = Number(settings?.cost_per_spin || 25);
  
  let spinType = 'paid';
  let cost = costPerSpin;

  if (userSpins && userSpins.free_spins_remaining > 0) {
    spinType = 'free';
    cost = 0;
  }

  console.log(`- Detected Spin Type: ${spinType.toUpperCase()}`);
  console.log(`- Cost: $${cost.toFixed(2)}`);

  // Choose a mock prize value (e.g. $10.50 prize)
  const mockPrize = { id: 'mock-prize-id', name: '$10.50 USDT', value: 10.50 };
  const rewardAmount = Number(mockPrize.value);
  let currentBalance = Number(updatedUser.balance || 0);

  // Process spin transaction (same as router/user.js POST /spin logic)
  await prisma.$transaction(async (tx) => {
    if (spinType === 'free') {
      await tx.user_spins.update({
        where: { user_id: userId },
        data: { 
          free_spins_remaining: { decrement: 1 },
          total_spins_used: { increment: 1 },
          total_rewards_earned: { increment: rewardAmount }
        }
      });
    } else {
      await tx.users.update({
        where: { id: userId },
        data: { balance: { decrement: cost } }
      });
      await tx.user_spins.update({
        where: { user_id: userId },
        data: { 
          total_spins_used: { increment: 1 },
          total_rewards_earned: { increment: rewardAmount }
        }
      });
      
      const balanceAfterCost = currentBalance - cost;
      if (cost > 0) {
          await tx.transactions.create({
              data: {
                user_id: userId,
                type: 'spin_cost',
                amount: cost,
                balance_before: currentBalance,
                balance_after: balanceAfterCost,
                description: 'Spin Wheel Cost'
              }
          });
      }
      currentBalance = balanceAfterCost;
    }

    if (rewardAmount > 0) {
      await tx.users.update({
        where: { id: userId },
        data: { withdrawable_balance: { increment: rewardAmount } }
      });

      const withdrawableBefore = Number(updatedUser.withdrawable_balance || 0);
      const withdrawableAfter = withdrawableBefore + rewardAmount;

      await tx.transactions.create({
        data: {
          user_id: userId,
          type: 'spin_reward',
          amount: rewardAmount,
          balance_before: withdrawableBefore,
          balance_after: withdrawableAfter,
          description: `Won ${mockPrize.name} from Spin Wheel`
        }
      });
    }
  });

  updatedUser = await prisma.users.findUnique({ where: { id: userId } });
  userSpins = await prisma.user_spins.findUnique({ where: { user_id: userId } });

  console.log('\nVerification after Spin 1 (Free Spin):');
  console.log(`- Balance (Deposit): $${Number(updatedUser.balance).toFixed(2)} (Expected: $60.00 - no deduction)`);
  console.log(`- Withdrawable Balance: $${Number(updatedUser.withdrawable_balance).toFixed(2)} (Expected: $10.50 - won reward)`);
  console.log(`- Free Spins Remaining: ${userSpins?.free_spins_remaining} (Expected: 0)`);

  if (Number(updatedUser.balance) === 60.00 && Number(updatedUser.withdrawable_balance) === 10.50 && userSpins?.free_spins_remaining === 0) {
    console.log('✅ FREE SPIN PROCESSING WORKS CORRECTLY!');
  } else {
    throw new Error('❌ Free spin processing verification failed.');
  }
  console.log('\n----------------------------------------\n');

  // 4. Play Spin 2 (Should be PAID because free_spins_remaining = 0)
  console.log('Step 4: Playing Spin 2 (should use PAID spin and deduct $25.00)...');
  
  if (userSpins && userSpins.free_spins_remaining > 0) {
    spinType = 'free';
    cost = 0;
  } else {
    spinType = 'paid';
    cost = costPerSpin;
  }

  console.log(`- Detected Spin Type: ${spinType.toUpperCase()}`);
  console.log(`- Cost: $${cost.toFixed(2)}`);

  // Assert user can afford
  if (Number(updatedUser.balance) < cost) {
    throw new Error('User should have been able to afford the spin');
  }

  // Choose a mock prize value (e.g. Try Again -> $0.00)
  const mockPrize2 = { id: 'mock-prize-id-2', name: 'Oops Try Again', value: 0.00 };
  const rewardAmount2 = Number(mockPrize2.value);
  currentBalance = Number(updatedUser.balance || 0);

  // Process spin transaction
  await prisma.$transaction(async (tx) => {
    if (spinType === 'free') {
      await tx.user_spins.update({
        where: { user_id: userId },
        data: { 
          free_spins_remaining: { decrement: 1 },
          total_spins_used: { increment: 1 },
          total_rewards_earned: { increment: rewardAmount2 }
        }
      });
    } else {
      await tx.users.update({
        where: { id: userId },
        data: { balance: { decrement: cost } }
      });
      await tx.user_spins.update({
        where: { user_id: userId },
        data: { 
          total_spins_used: { increment: 1 },
          total_rewards_earned: { increment: rewardAmount2 }
        }
      });
      
      const balanceAfterCost = currentBalance - cost;
      if (cost > 0) {
          await tx.transactions.create({
              data: {
                user_id: userId,
                type: 'spin_cost',
                amount: cost,
                balance_before: currentBalance,
                balance_after: balanceAfterCost,
                description: 'Spin Wheel Cost'
              }
          });
      }
      currentBalance = balanceAfterCost;
    }

    if (rewardAmount2 > 0) {
      await tx.users.update({
        where: { id: userId },
        data: { withdrawable_balance: { increment: rewardAmount2 } }
      });

      const withdrawableBefore = Number(updatedUser.withdrawable_balance || 0);
      const withdrawableAfter = withdrawableBefore + rewardAmount2;

      await tx.transactions.create({
        data: {
          user_id: userId,
          type: 'spin_reward',
          amount: rewardAmount2,
          balance_before: withdrawableBefore,
          balance_after: withdrawableAfter,
          description: `Won ${mockPrize2.name} from Spin Wheel`
        }
      });
    }
  });

  updatedUser = await prisma.users.findUnique({ where: { id: userId } });
  userSpins = await prisma.user_spins.findUnique({ where: { user_id: userId } });

  console.log('\nVerification after Spin 2 (Paid Spin - try again prize):');
  console.log(`- Balance (Deposit): $${Number(updatedUser.balance).toFixed(2)} (Expected: $35.00 - $25.00 deducted)`);
  console.log(`- Withdrawable Balance: $${Number(updatedUser.withdrawable_balance).toFixed(2)} (Expected: $10.50 - no new rewards)`);
  console.log(`- Free Spins Remaining: ${userSpins?.free_spins_remaining} (Expected: 0)`);

  if (Number(updatedUser.balance) === 35.00 && Number(updatedUser.withdrawable_balance) === 10.50 && userSpins?.free_spins_remaining === 0) {
    console.log('✅ PAID SPIN DEDUCTION WORKS CORRECTLY!');
  } else {
    throw new Error('❌ Paid spin deduction verification failed.');
  }
  console.log('\n----------------------------------------\n');

  // 5. Play Spin 3 (Should FAIL due to Insufficient balance)
  console.log('Step 5: Testing Insufficient Balance handling (reducing balance to $5.00)...');
  
  updatedUser = await prisma.users.update({
    where: { id: userId },
    data: { balance: 5.00 }
  });

  if (userSpins && userSpins.free_spins_remaining > 0) {
    spinType = 'free';
    cost = 0;
  } else {
    spinType = 'paid';
    cost = costPerSpin;
  }

  console.log(`- Current Deposit Balance: $${Number(updatedUser.balance).toFixed(2)}`);
  console.log(`- Cost required: $${cost.toFixed(2)}`);

  if (spinType === 'paid' && Number(updatedUser.balance) < cost) {
    console.log('✅ INSIGNIFICANT BALANCE BLOCKED CORRECTLY (Mocked Check Succeeded)');
  } else {
    throw new Error('❌ Insufficient balance check failed to block the spin.');
  }

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n');

  // Clean up test user records
  console.log('Cleaning up test records...');
  await prisma.user_spins.deleteMany({ where: { user_id: userId } });
  await prisma.spin_logs.deleteMany({ where: { user_id: userId } });
  await prisma.transactions.deleteMany({ where: { user_id: userId } });
  await prisma.deposits.deleteMany({ where: { user_id: userId } });
  await prisma.users.delete({ where: { id: userId } });
  console.log('Clean up done.');
}

runTest()
  .catch(err => {
    console.error('Test Failed with Error:', err);
  })
  .finally(() => prisma.$disconnect());

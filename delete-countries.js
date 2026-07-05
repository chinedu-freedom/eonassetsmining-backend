import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log("Starting deletion sequence on live/target database...");

  try {
    // 1. Delete dependent user logs & transactions
    console.log("Deleting investment_profits...");
    await prisma.investment_profits.deleteMany({});

    console.log("Deleting password_resets...");
    await prisma.password_resets.deleteMany({});

    console.log("Deleting user_spins...");
    await prisma.user_spins.deleteMany({});

    console.log("Deleting email_logs...");
    await prisma.email_logs.deleteMany({});

    console.log("Deleting activity_logs...");
    await prisma.activity_logs.deleteMany({});

    console.log("Deleting referral_commissions...");
    await prisma.referral_commissions.deleteMany({});

    console.log("Deleting gift_code_claims...");
    await prisma.gift_code_claims.deleteMany({});

    console.log("Deleting task_claims...");
    await prisma.task_claims.deleteMany({});

    console.log("Deleting user_checkins...");
    await prisma.user_checkins.deleteMany({});

    console.log("Deleting spin_logs...");
    await prisma.spin_logs.deleteMany({});

    console.log("Deleting transactions...");
    await prisma.transactions.deleteMany({});

    console.log("Deleting withdrawals...");
    await prisma.withdrawals.deleteMany({});

    console.log("Deleting deposits...");
    await prisma.deposits.deleteMany({});

    console.log("Deleting investments...");
    await prisma.investments.deleteMany({});

    // 2. Clear referral self-references on users table
    console.log("Clearing referral references on users...");
    await prisma.users.updateMany({
      data: { referred_by: null }
    });

    // 3. Delete users
    console.log("Deleting all users...");
    await prisma.users.deleteMany({});

    // 4. Delete countries
    console.log("Deleting all countries...");
    await prisma.countries.deleteMany({});

    console.log("Success: All users and countries have been deleted from the database.");
  } catch (error) {
    console.error("Error during deletion sequence:", error);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Setting up test user with investments and profits...");
  const country = await prisma.countries.findFirst();
  const language = await prisma.languages.findFirst();
  if (!country || !language) {
    console.log("No country or language found. Run seed script first.");
    return;
  }

  const user = await prisma.users.create({
    data: {
      email: "test_delete@example.com",
      full_name: "Test Delete",
      password_hash: "dummy",
      country_id: country.id,
      language_id: language.id,
      referral_code: "test_delete_ref"
    }
  });
  
  const plan = await prisma.plans.findFirst();
  if (!plan) {
    console.log("No plan found.");
    return;
  }
  
  const investment = await prisma.investments.create({
    data: {
      user_id: user.id,
      plan_id: plan.id,
      amount: 100,
      daily_profit: 1,
      status: "active",
      start_date: new Date(),
      end_date: new Date(Date.now() + 86400000)
    }
  });
  
  await prisma.investment_profits.create({
    data: {
      investment_id: investment.id,
      user_id: user.id,
      amount: 1
    }
  });

  console.log("Attempting to delete user...");
  try {
    const userId = user.id;
    await prisma.investment_profits.deleteMany({ where: { user_id: userId } });
    await prisma.transactions.deleteMany({ where: { user_id: userId } });
    await prisma.investments.deleteMany({ where: { user_id: userId } });
    await prisma.users.delete({ where: { id: userId } });
    console.log("Successfully deleted user with investments and profits!");
  } catch (err) {
    console.error("Deletion failed:", err);
    // Cleanup manually if failed
    await prisma.investment_profits.deleteMany({ where: { user_id: userId } }).catch(() => {});
    await prisma.investments.deleteMany({ where: { user_id: userId } }).catch(() => {});
    await prisma.users.delete({ where: { id: userId } }).catch(() => {});
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

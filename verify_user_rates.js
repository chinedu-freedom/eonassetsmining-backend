import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.users.findUnique({
    where: { email: 'chinedufreedom60@gmail.com' },
    include: { country: true }
  });
  
  if (!user) {
    console.log("User 'chinedufreedom60@gmail.com' not found.");
    return;
  }
  
  console.log("User Found:");
  console.log({
    id: user.id,
    email: user.email,
    username: user.username,
    balance: user.balance,
    withdrawable_balance: user.withdrawable_balance,
    gift_balance: user.gift_balance,
    country_id: user.country_id,
    country: user.country ? {
      id: user.country.id,
      country_code: user.country.country_code,
      country_name: user.country.country_name,
      currency_symbol: user.country.currency_symbol,
      currency_code: user.country.currency_code,
      exchange_rate: user.country.exchange_rate,
      auto_update: user.country.auto_update,
      status: user.country.status
    } : null
  });

  const countries = await prisma.countries.findMany();
  console.log("\nAll Available Countries in Database:");
  console.log(countries.map(c => ({
    country_name: c.country_name,
    country_code: c.country_code,
    currency_code: c.currency_code,
    exchange_rate: c.exchange_rate,
    auto_update: c.auto_update
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

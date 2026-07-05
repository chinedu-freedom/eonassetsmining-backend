import { runExchangeRateCron } from './src/cron.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log("Starting exchange rate sync...");
  await runExchangeRateCron();
  console.log("Exchange rate sync complete. Fetching updated counts...");
  const countries = await prisma.countries.findMany();
  console.log(`Total countries in database: ${countries.length}`);
  const sample = countries.filter(c => ['NG', 'ZA', 'EG', 'GB', 'IN'].includes(c.country_code));
  console.log("Sample exchange rates:");
  console.table(sample.map(s => ({
    name: s.country_name,
    code: s.country_code,
    currency: s.currency_code,
    symbol: s.currency_symbol,
    rate: s.exchange_rate.toString(),
    autoUpdate: s.auto_update
  })));
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

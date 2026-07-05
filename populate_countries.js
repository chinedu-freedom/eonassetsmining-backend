import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const countriesList = [
  { country_code: 'AF', country_name: 'Afghanistan', currency_symbol: '؋', currency_code: 'AFN', exchange_rate: 70 },
  { country_code: 'AL', country_name: 'Albania', currency_symbol: 'L', currency_code: 'ALL', exchange_rate: 90 },
  { country_code: 'DZ', country_name: 'Algeria', currency_symbol: 'د.ج', currency_code: 'DZD', exchange_rate: 130 },
  { country_code: 'AR', country_name: 'Argentina', currency_symbol: '$', currency_code: 'ARS', exchange_rate: 800 },
  { country_code: 'AU', country_name: 'Australia', currency_symbol: '$', currency_code: 'AUD', exchange_rate: 1.5 },
  { country_code: 'BS', country_name: 'Bahamas', currency_symbol: '$', currency_code: 'BSD', exchange_rate: 1 },
  { country_code: 'BH', country_name: 'Bahrain', currency_symbol: '.د.ب', currency_code: 'BHD', exchange_rate: 0.37 },
  { country_code: 'BD', country_name: 'Bangladesh', currency_symbol: '৳', currency_code: 'BDT', exchange_rate: 109 },
  { country_code: 'BR', country_name: 'Brazil', currency_symbol: 'R$', currency_code: 'BRL', exchange_rate: 5 },
  { country_code: 'CA', country_name: 'Canada', currency_symbol: '$', currency_code: 'CAD', exchange_rate: 1.3 },
  { country_code: 'CN', country_name: 'China', currency_symbol: '¥', currency_code: 'CNY', exchange_rate: 7.2 },
  { country_code: 'FR', country_name: 'France', currency_symbol: '€', currency_code: 'EUR', exchange_rate: 0.9 },
  { country_code: 'DE', country_name: 'Germany', currency_symbol: '€', currency_code: 'EUR', exchange_rate: 0.9 },
  { country_code: 'IN', country_name: 'India', currency_symbol: '₹', currency_code: 'INR', exchange_rate: 83 },
  { country_code: 'ID', country_name: 'Indonesia', currency_symbol: 'Rp', currency_code: 'IDR', exchange_rate: 15600 },
  { country_code: 'IT', country_name: 'Italy', currency_symbol: '€', currency_code: 'EUR', exchange_rate: 0.9 },
  { country_code: 'JP', country_name: 'Japan', currency_symbol: '¥', currency_code: 'JPY', exchange_rate: 150 },
  { country_code: 'MX', country_name: 'Mexico', currency_symbol: '$', currency_code: 'MXN', exchange_rate: 17 },
  { country_code: 'NG', country_name: 'Nigeria', currency_symbol: '₦', currency_code: 'NGN', exchange_rate: 1500 },
  { country_code: 'PK', country_name: 'Pakistan', currency_symbol: '₨', currency_code: 'PKR', exchange_rate: 280 },
  { country_code: 'RU', country_name: 'Russia', currency_symbol: '₽', currency_code: 'RUB', exchange_rate: 90 },
  { country_code: 'ZA', country_name: 'South Africa', currency_symbol: 'R', currency_code: 'ZAR', exchange_rate: 19 },
  { country_code: 'GB', country_name: 'United Kingdom', currency_symbol: '£', currency_code: 'GBP', exchange_rate: 0.78 },
  { country_code: 'US', country_name: 'United States', currency_symbol: '$', currency_code: 'USD', exchange_rate: 1 },
];

async function main() {
  console.log('Populating countries...');
  for (const c of countriesList) {
    await prisma.countries.upsert({
      where: { country_code: c.country_code },
      update: {
        country_name: c.country_name,
        currency_symbol: c.currency_symbol,
        currency_code: c.currency_code,
        exchange_rate: c.exchange_rate,
        auto_update: true,
      },
      create: {
        ...c,
        auto_update: true,
      },
    });
  }
  console.log('Countries populated successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

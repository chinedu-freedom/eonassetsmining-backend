import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("=== ZAR COUNTRY ===");
  const country = await prisma.countries.findUnique({
    where: { country_code: 'ZA' }
  });
  console.log(JSON.stringify(country, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

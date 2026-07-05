import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const countries = await prisma.countries.findMany();
  console.log(countries);
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

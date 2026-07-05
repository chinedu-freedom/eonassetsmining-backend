import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.settings.findFirst();
  console.log("Settings:");
  console.log(settings);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

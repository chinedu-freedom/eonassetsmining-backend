import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emailSettings = await prisma.email_settings.findFirst();
  console.log("Email Settings:", emailSettings);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

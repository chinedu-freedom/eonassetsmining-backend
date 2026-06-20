import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all payment methods...");
  const result = await prisma.payment_methods.deleteMany({});
  console.log(`Successfully deleted ${result.count} payment methods from the database.`);
}

main()
  .catch(e => {
    console.error("Error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Updating database settings table...");
  const settings = await prisma.settings.findFirst();
  if (settings) {
    await prisma.settings.update({
      where: { id: settings.id },
      data: {
        site_name: "Kryptex Mining",
        site_title: "Kryptex Mining"
      }
    });
    console.log("Database settings table updated successfully!");
  } else {
    await prisma.settings.create({
      data: {
        site_name: "Kryptex Mining",
        site_title: "Kryptex Mining"
      }
    });
    console.log("Database settings table created successfully!");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

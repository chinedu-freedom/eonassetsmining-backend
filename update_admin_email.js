import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Updating admin email from admin@eonassets.com to admin@kryptex.com...");
  const admin = await prisma.admins.findFirst({
    where: { email: "admin@eonassets.com" }
  });
  if (admin) {
    const updatedAdmin = await prisma.admins.update({
      where: { id: admin.id },
      data: {
        email: "admin@kryptex.com"
      }
    });
    console.log("Admin email updated successfully! New Email:", updatedAdmin.email);
  } else {
    const existing = await prisma.admins.findUnique({
      where: { email: "admin@kryptex.com" }
    });
    if (existing) {
      console.log("Admin account with email admin@kryptex.com already exists!");
    } else {
      console.log("No admin found with email admin@eonassets.com to update.");
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

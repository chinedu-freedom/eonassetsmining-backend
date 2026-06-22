import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  // Clear existing prizes
  await prisma.spin_prizes.deleteMany({});
  
  const prizes = [
    { position: 1, name: "$0.01", value: 0.01, weight: 500, probability: 0.5, color: "#3b82f6", icon: "Coins" },
    { position: 2, name: "$0.50", value: 0.50, weight: 200, probability: 0.2, color: "#3b82f6", icon: "Coins" },
    { position: 3, name: "$0.80", value: 0.80, weight: 150, probability: 0.15, color: "#3b82f6", icon: "Coins" },
    { position: 4, name: "$1.00", value: 1.00, weight: 100, probability: 0.1, color: "#3b82f6", icon: "Coins" },
    { position: 5, name: "$3.00", value: 3.00, weight: 30, probability: 0.03, color: "#3b82f6", icon: "Banknote" },
    { position: 6, name: "$5.00", value: 5.00, weight: 15, probability: 0.015, color: "#3b82f6", icon: "Banknote" },
    { position: 7, name: "$10.00", value: 10.00, weight: 4, probability: 0.004, color: "#3b82f6", icon: "Wallet" },
    { position: 8, name: "$25.00", value: 25.00, weight: 1, probability: 0.001, color: "#3b82f6", icon: "Diamond" }
  ];

  for (const prize of prizes) {
    await prisma.spin_prizes.create({ data: prize });
  }

  console.log("Successfully seeded exactly 8 prizes!");
}

seed().catch(console.error).finally(() => prisma.$disconnect());

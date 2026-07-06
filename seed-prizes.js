import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  // Clear existing prizes
  await prisma.spin_prizes.deleteMany({});
  
  const prizes = [
    { position: 1, name: "$0.50", value: 0.50, weight: 300, probability: 0.30, color: "#3b82f6", icon: "Coins" },
    { position: 2, name: "$2.50", value: 2.50, weight: 100, probability: 0.10, color: "#3b82f6", icon: "Coins" },
    { position: 3, name: "$0.20", value: 0.20, weight: 200, probability: 0.20, color: "#3b82f6", icon: "Coins" },
    { position: 4, name: "$10.50", value: 10.50, weight: 15, probability: 0.015, color: "#3b82f6", icon: "Coins" },
    { position: 5, name: "$0.77", value: 0.77, weight: 150, probability: 0.150, color: "#3b82f6", icon: "Coins" },
    { position: 6, name: "$15.15", value: 15.15, weight: 10, probability: 0.010, color: "#3b82f6", icon: "Banknote" },
    { position: 7, name: "$1.25", value: 1.25, weight: 80, probability: 0.080, color: "#3b82f6", icon: "Coins" },
    { position: 8, name: "$20.20", value: 20.20, weight: 5, probability: 0.005, color: "#3b82f6", icon: "Banknote" },
    { position: 9, name: "Oops! Try Again 🥲", value: 0.00, weight: 140, probability: 0.140, color: "#ef4444", icon: "Frown" }
  ];

  for (const prize of prizes) {
    await prisma.spin_prizes.create({ data: prize });
  }
  console.log("Successfully seeded exactly 9 prizes!");

  // Update spin settings cost_per_spin to 25
  const settings = await prisma.spin_settings.findFirst();
  if (settings) {
    await prisma.spin_settings.update({
      where: { id: settings.id },
      data: { cost_per_spin: 25.0 }
    });
    console.log("Successfully updated cost per spin to $25.00!");
  } else {
    await prisma.spin_settings.create({
      data: {
        cost_per_spin: 25.0,
        feature_enabled: true
      }
    });
    console.log("Successfully created spin settings and set cost per spin to $25.00!");
  }
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

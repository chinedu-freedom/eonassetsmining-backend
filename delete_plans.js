import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const plansToDelete = await prisma.plans.findMany({
    where: {
      OR: [
        { name: { contains: 'antminer', mode: 'insensitive' } },
        { name: { contains: 'fixedminer', mode: 'insensitive' } }
      ]
    },
    select: { id: true, name: true }
  });

  const planIds = plansToDelete.map(p => p.id);

  if (planIds.length > 0) {
    console.log(`Found plans: ${plansToDelete.map(p => p.name).join(', ')}. Deleting child records...`);
    
    // Find investments referencing these plans
    const investments = await prisma.investments.findMany({
      where: { plan_id: { in: planIds } },
      select: { id: true }
    });
    const investmentIds = investments.map(i => i.id);
    
    if (investmentIds.length > 0) {
      // Delete profit logs
      await prisma.investment_profits.deleteMany({
        where: { investment_id: { in: investmentIds } }
      });
    }

    // Delete investments
    await prisma.investments.deleteMany({
      where: { plan_id: { in: planIds } }
    });

    // Delete plans
    const result = await prisma.plans.deleteMany({
      where: { id: { in: planIds } }
    });
    console.log(`Successfully deleted ${result.count} plans.`);
  } else {
    console.log("No matching plans (antminer, fixedminer) found in the database.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

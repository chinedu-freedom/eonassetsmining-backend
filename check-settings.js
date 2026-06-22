import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.spin_settings.findFirst().then(console.log).finally(() => prisma.$disconnect());

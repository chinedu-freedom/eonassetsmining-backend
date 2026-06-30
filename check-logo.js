import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const settings = await prisma.settings.findFirst();
  console.log("platform_logo length:", settings?.platform_logo ? settings.platform_logo.length : 'null');
  if (settings?.platform_logo) {
    console.log("platform_logo prefix:", settings.platform_logo.substring(0, 100));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

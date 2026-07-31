import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const logoPath = path.resolve('../eonassetsmining-user/public/logo.jpeg');
  if (!fs.existsSync(logoPath)) {
    console.error(`Error: logo.jpeg not found at ${logoPath}`);
    process.exit(1);
  }

  // 1. Convert logo.jpeg to base64 Data URL
  const logoBuffer = fs.readFileSync(logoPath);
  const base64Logo = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;

  console.log("Updating database settings.platform_logo...");
  const settings = await prisma.settings.findFirst();
  if (settings) {
    await prisma.settings.update({
      where: { id: settings.id },
      data: { platform_logo: base64Logo }
    });
    console.log("Database updated successfully!");
  } else {
    console.warn("No settings record found in database!");
  }

  // 2. Overwrite local user frontend assets
  const targets = [
    '../eonassetsmining-user/src/app/favicon.ico',
    '../eonassetsmining-user/public/icon-192x192.png',
    '../eonassetsmining-user/public/icon-512x512.png'
  ];

  for (const target of targets) {
    const targetPath = path.resolve(target);
    fs.writeFileSync(targetPath, logoBuffer);
    console.log(`Overwrote ${targetPath}`);
  }

  console.log("All updates completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

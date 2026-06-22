import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const prisma = new PrismaClient();

async function seed() {
  await prisma.partners.deleteMany({});
  
  const partners = [
    { partner_name: 'Binance', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
    { partner_name: 'Bybit', logo: 'https://cryptologos.cc/logos/bybit-logo.png' }, // or similar
    { partner_name: 'Coinbase', logo: 'https://cryptologos.cc/logos/coinbase-coin-logo.png' },
    { partner_name: 'KuCoin', logo: 'https://cryptologos.cc/logos/kucoin-token-kcs-logo.png' },
    { partner_name: 'Tesla', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png' },
    { partner_name: 'Gate.io', logo: 'https://cryptologos.cc/logos/gate-token-gt-logo.png' },
    { partner_name: 'USDC', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
    { partner_name: 'Tether', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }
  ];

  for (let i = 0; i < partners.length; i++) {
    await prisma.partners.create({
      data: {
        partner_name: partners[i].partner_name,
        logo: partners[i].logo,
        display_order: i + 1,
        status: true
      }
    });
  }
  
  console.log('Seeded partners');
}

seed().catch(e => console.error(e)).finally(() => prisma.$disconnect());

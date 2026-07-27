import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const assetsToSeed = [
  { symbol: "BTC", name: "Bitcoin", trading_pair: "BTCUSDT", logo_url: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
  { symbol: "ETH", name: "Ethereum", trading_pair: "ETHUSDT", logo_url: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  { symbol: "SOL", name: "Solana", trading_pair: "SOLUSDT", logo_url: "https://assets.coingecko.com/coins/images/4128/large/solana.png" },
  { symbol: "ADA", name: "Cardano", trading_pair: "ADAUSDT", logo_url: "https://assets.coingecko.com/coins/images/975/large/cardano.png" },
  { symbol: "XRP", name: "Ripple", trading_pair: "XRPUSDT", logo_url: "https://assets.coingecko.com/coins/images/44/large/ripple.png" },
  { symbol: "DOGE", name: "Dogecoin", trading_pair: "DOGEUSDT", logo_url: "https://assets.coingecko.com/coins/images/782/large/dogecoin.png" },
  { symbol: "AVAX", name: "Avalanche", trading_pair: "AVAXUSDT", logo_url: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_Red.png" },
  { symbol: "MATIC", name: "Polygon", trading_pair: "MATICUSDT", logo_url: "https://assets.coingecko.com/coins/images/4713/large/polygon.png" },
  { symbol: "LINK", name: "Chainlink", trading_pair: "LINKUSDT", logo_url: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png" },
  { symbol: "DOT", name: "Polkadot", trading_pair: "DOTUSDT", logo_url: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png" }
];

async function main() {
  console.log("Seeding 10 market assets...");
  for (const asset of assetsToSeed) {
    await prisma.market_assets.upsert({
      where: { symbol: asset.symbol },
      update: {
        name: asset.name,
        trading_pair: asset.trading_pair,
        logo_url: asset.logo_url,
        status: true
      },
      create: {
        symbol: asset.symbol,
        name: asset.name,
        trading_pair: asset.trading_pair,
        logo_url: asset.logo_url,
        status: true
      }
    });
  }
  console.log("Seeding complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

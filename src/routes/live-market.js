import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get active market assets if visibility is enabled
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();
    const isVisible = settings ? settings.live_market_enabled : true;

    // If live market is disabled in settings, return an empty array or a disabled flag
    if (!isVisible) {
      return res.json({
        success: true,
        isVisible: false,
        assets: []
      });
    }

    const assets = await prisma.market_assets.findMany({
      where: {
        status: true
      },
      orderBy: { symbol: 'asc' }
    });

    res.json({
      success: true,
      isVisible: true,
      assets
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch live market data' });
  }
});

// Proxy route to bypass frontend CORS blocks
router.get('/proxy', async (req, res) => {
  try {
    const symbol = req.query.symbol;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });
    
    // Use dynamic import for node-fetch if global fetch is not available or just use global fetch for Node 18+
    const fetchResponse = await fetch(`https://api.mexc.com/api/v3/ticker/24hr?symbol=${symbol}USDT`);
    const data = await fetchResponse.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from MEXC' });
  }
});

export default router;

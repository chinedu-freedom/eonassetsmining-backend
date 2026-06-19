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

export default router;

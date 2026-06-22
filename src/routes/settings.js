import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get public settings (like contact links, etc)
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst({
      select: {
        site_name: true,
        site_title: true,
        currency_symbol: true,
        telegram_support: true,
        whatsapp_support: true,
        telegram_community: true,
        telegram_group: true,
        deposit_notice: true,
        withdrawal_notice: true,
        live_market_enabled: true
      }
    });
    
    res.json({ success: true, settings: settings || {} });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

export default router;

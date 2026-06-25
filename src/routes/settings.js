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
        whatsapp_group: true,
        deposit_notice: true,
        withdrawal_notice: true,
        min_withdrawal: true,
        max_withdrawal: true,
        withdrawal_charge: true,
        min_deposit: true,
        max_deposit: true,
        deposit_charge: true,
        live_market_enabled: true
      }
    });
    
    res.json({ success: true, settings: settings || {} });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// Get active payout cryptocurrencies for deposit options
router.get('/payout-cryptos', async (req, res) => {
  try {
    const cryptos = await prisma.payout_cryptocurrencies.findMany({
      where: { status: true },
      orderBy: { sort_order: 'asc' }
    });
    
    res.json({ success: true, data: cryptos });
  } catch (error) {
    console.error('Failed to fetch payout cryptos:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cryptos' });
  }
});

export default router;

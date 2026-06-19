import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get settings and market assets
router.get('/', async (req, res) => {
  try {
    const assets = await prisma.market_assets.findMany({
      orderBy: { symbol: 'asc' }
    });

    let settings = await prisma.settings.findFirst();
    // In case settings don't exist yet, we can default it
    const isVisible = settings ? settings.live_market_enabled : true;

    res.json({
      success: true,
      assets,
      isVisible
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch live market data' });
  }
});

// Add new cryptocurrency
router.post('/', async (req, res) => {
  try {
    const { symbol, name, trading_pair, logo_url, status } = req.body;

    // Optional: check if symbol already exists
    const existing = await prisma.market_assets.findUnique({
      where: { symbol }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Symbol already exists' });
    }

    const newAsset = await prisma.market_assets.create({
      data: {
        symbol,
        name,
        trading_pair,
        logo_url,
        status: status !== undefined ? status : true
      }
    });

    res.json({ success: true, message: 'Cryptocurrency added successfully', asset: newAsset });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add cryptocurrency' });
  }
});

// Edit cryptocurrency
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { symbol, name, trading_pair, logo_url, status } = req.body;

    const updated = await prisma.market_assets.update({
      where: { id },
      data: {
        symbol,
        name,
        trading_pair,
        logo_url,
        status
      }
    });

    res.json({ success: true, message: 'Cryptocurrency updated successfully', asset: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update cryptocurrency' });
  }
});

// Delete cryptocurrency
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.market_assets.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Cryptocurrency deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete cryptocurrency' });
  }
});

// Toggle visibility setting
router.put('/settings/visibility', async (req, res) => {
  try {
    const { isVisible } = req.body;
    
    const settings = await prisma.settings.findFirst();
    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { live_market_enabled: isVisible }
      });
    } else {
      // If there are no settings at all, you might need to create a default one
      // But typically a settings row exists.
    }

    res.json({ success: true, message: 'Live market visibility updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update visibility' });
  }
});

export default router;

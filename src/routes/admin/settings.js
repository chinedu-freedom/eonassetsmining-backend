import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper factory for simple CRUD
const createCrudRoutes = (modelName) => {
  const r = Router();
  
  r.get('/', async (req, res) => {
    try {
      const items = await prisma[modelName].findMany();
      res.json(items);
    } catch (e) {
      res.status(500).json({ error: `Failed to fetch ${modelName}` });
    }
  });

  r.post('/', async (req, res) => {
    try {
      const item = await prisma[modelName].create({ data: req.body });
      res.status(201).json(item);
    } catch (e) {
      res.status(500).json({ error: `Failed to create ${modelName}` });
    }
  });

  r.put('/:id', async (req, res) => {
    try {
      const item = await prisma[modelName].update({ where: { id: req.params.id }, data: req.body });
      res.json(item);
    } catch (e) {
      res.status(500).json({ error: `Failed to update ${modelName}` });
    }
  });

  r.delete('/:id', async (req, res) => {
    try {
      await prisma[modelName].delete({ where: { id: req.params.id } });
      res.json({ message: 'Deleted successfully' });
    } catch (e) {
      res.status(500).json({ error: `Failed to delete ${modelName}` });
    }
  });

  return r;
};

// Generic CRUD endpoints for settings tables
router.use('/countries', createCrudRoutes('countries'));
router.use('/languages', createCrudRoutes('languages'));
router.use('/payment-methods', createCrudRoutes('payment_methods'));
router.use('/payout-cryptos', createCrudRoutes('payout_cryptocurrencies'));
router.use('/market-assets', createCrudRoutes('market_assets'));

// ----- Global Platform Settings -----
router.get('/platform', async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          site_name: "Eon Assets Mining",
          site_title: "Eon Assets",
          currency_name: "USD",
          currency_symbol: "$",
          timezone: "UTC",
          theme_color: "#000000",
          support_email: "support@eonassets.com",
          whatsapp_number: "",
          telegram_link: "",
          welcome_bonus: 0,
          welcome_bonus_destination: "deposit",
          daily_checkin_enabled: true,
          live_market_enabled: true
        }
      });
    }
    res.json(settings || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
});

router.put('/platform', async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();
    if (settings) {
      settings = await prisma.settings.update({ where: { id: settings.id }, data: req.body });
    } else {
      settings = await prisma.settings.create({ data: req.body });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update platform settings' });
  }
});

// ----- Email Settings -----
router.get('/email', async (req, res) => {
  try {
    const settings = await prisma.email_settings.findFirst();
    res.json(settings || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch email settings' });
  }
});

router.put('/email', async (req, res) => {
  try {
    let settings = await prisma.email_settings.findFirst();
    if (settings) {
      settings = await prisma.email_settings.update({ where: { id: settings.id }, data: req.body });
    } else {
      settings = await prisma.email_settings.create({ data: req.body });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update email settings' });
  }
});

export default router;

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Sync/Update all exchange rates manually
router.post('/update-rates', async (req, res) => {
  try {
    const { runExchangeRateCron } = await import('../../cron.js');
    await runExchangeRateCron();
    res.json({ success: true, message: 'All exchange rates updated successfully' });
  } catch (error) {
    console.error('Failed to update exchange rates:', error);
    res.status(500).json({ success: false, error: 'Failed to update exchange rates' });
  }
});

// Get all countries
router.get('/', async (req, res) => {
  try {
    const countries = await prisma.countries.findMany({
      orderBy: { country_name: 'asc' }
    });
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// Get single country
router.get('/:id', async (req, res) => {
  try {
    const country = await prisma.countries.findUnique({
      where: { id: req.params.id }
    });
    if (!country) return res.status(404).json({ error: 'Country not found' });
    res.json(country);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch country' });
  }
});

// Create country
router.post('/', async (req, res) => {
  try {
    const { country_code, country_name, currency_symbol, currency_code, exchange_rate, status } = req.body;
    
    let rate = Number(exchange_rate) || 1;
    if (currency_code) {
      try {
        const fetchRes = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await fetchRes.json();
        if (data && data.rates && data.rates[currency_code.toUpperCase()]) {
          rate = data.rates[currency_code.toUpperCase()];
        }
      } catch (err) {
        console.error("Failed to fetch initial live rate during creation:", err);
      }
    }

    const newCountry = await prisma.countries.create({
      data: {
        country_code,
        country_name,
        currency_symbol,
        currency_code,
        exchange_rate: rate,
        auto_update: true,
        status: status === 'active' || status === true
      }
    });
    res.status(201).json(newCountry);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Country code already exists' });
    }
    console.error("Create country error:", error);
    res.status(500).json({ error: 'Failed to create country' });
  }
});

// Update country
router.put('/:id', async (req, res) => {
  try {
    const { country_code, country_name, currency_symbol, currency_code, exchange_rate, status } = req.body;
    
    let rate = Number(exchange_rate) || 1;
    if (currency_code) {
      try {
        const fetchRes = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await fetchRes.json();
        if (data && data.rates && data.rates[currency_code.toUpperCase()]) {
          rate = data.rates[currency_code.toUpperCase()];
        }
      } catch (err) {
        console.error("Failed to fetch live rate during update:", err);
      }
    }

    const updatedCountry = await prisma.countries.update({
      where: { id: req.params.id },
      data: {
        country_code,
        country_name,
        currency_symbol,
        currency_code,
        exchange_rate: rate,
        auto_update: true,
        status: status === 'active' || status === true
      }
    });
    res.json(updatedCountry);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Country code already exists' });
    }
    console.error("Update country error:", error);
    res.status(500).json({ error: 'Failed to update country' });
  }
});

// Delete country
router.delete('/:id', async (req, res) => {
  try {
    await prisma.countries.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Country deleted successfully' });
  } catch (error) {
    console.error("Delete country error:", error);
    res.status(500).json({ error: 'Failed to delete country' });
  }
});

export default router;

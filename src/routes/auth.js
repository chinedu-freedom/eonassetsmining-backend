import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// User Registration
router.post('/register', async (req, res) => {
  let { email, password, full_name, username, country_id, language_id, referred_by_code } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Missing required fields (email, password, full_name)' });
  }

  try {
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    if (!country_id) {
      const defaultCountry = await prisma.countries.findFirst();
      if (defaultCountry) country_id = defaultCountry.id;
    }
    if (!language_id) {
      const defaultLanguage = await prisma.languages.findFirst();
      if (defaultLanguage) language_id = defaultLanguage.id;
    }

    const password_hash = await bcrypt.hash(password, 10);
    
    // Generate unique referral code (first 4 letters of name + random numbers)
    const prefix = full_name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'EON');
    const referral_code = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;

    let referred_by_id = null;
    if (referred_by_code) {
      const referrer = await prisma.users.findUnique({ where: { referral_code: referred_by_code } });
      if (referrer) {
        referred_by_id = referrer.id;
      }
    }

    const user = await prisma.users.create({
      data: {
        email,
        password_hash,
        full_name,
        username,
        country_id,
        language_id,
        referral_code,
        referred_by: referred_by_id
      }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        balance: user.balance,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Get Countries
router.get('/countries', async (req, res) => {
  try {
    const countries = await prisma.countries.findMany({
      orderBy: { country_name: 'asc' },
    });
    res.json({ success: true, data: countries });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch countries' });
  }
});

// Get Languages
router.get('/languages', async (req, res) => {
  try {
    const languages = await prisma.languages.findMany({
      where: { status: true },
      orderBy: { sort_order: 'asc' },
    });
    res.json({ success: true, data: languages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch languages' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        balance: user.balance,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await prisma.admins.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Admin login failed', details: error.message });
  }
});

export default router;

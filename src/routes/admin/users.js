import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { logActivity } from '../../lib/logger.js';

const router = Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        country: true
      }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.params.id },
      include: {
        country: true,
        transactions: { orderBy: { created_at: 'desc' }, take: 10 },
        investments: true
      }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// Update user settings/permissions
router.put('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.new_password) {
      const bcrypt = await import('bcrypt');
      data.password_hash = await bcrypt.hash(data.new_password, 10);
    }
    delete data.new_password;

    const user = await prisma.users.update({
      where: { id: req.params.id },
      data: data
    });

    if (data.is_active !== undefined) {
      const action = data.is_active ? 'user unbanned' : 'user banned';
      await logActivity(user.id, action, req);
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Manual Credit
router.post('/:id/credit', async (req, res) => {
  const { amount, reason, balance_type } = req.body; // balance_type: 'main' or 'gift'
  try {
    const user = await prisma.users.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentBalance = balance_type === 'gift' ? user.gift_balance : user.balance;
    const newBalance = Number(currentBalance) + Number(amount);

    const updatedUser = await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: balance_type === 'gift' ? { gift_balance: newBalance } : { balance: newBalance }
      }),
      prisma.transactions.create({
        data: {
          user_id: user.id,
          type: 'ADMIN_CREDIT',
          amount: amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: reason || 'Manual credit by admin'
        }
      })
    ]);

    await logActivity(user.id, 'admin credit', req, { amount, reason, balance_type });

    res.json(updatedUser[0]);
  } catch (error) {
    res.status(500).json({ error: 'Credit failed', details: error.message });
  }
});

// Manual Debit
router.post('/:id/debit', async (req, res) => {
  const { amount, reason, balance_type } = req.body;
  try {
    const user = await prisma.users.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentBalance = balance_type === 'gift' ? user.gift_balance : user.balance;
    if (Number(currentBalance) < Number(amount)) {
      return res.status(400).json({ error: 'Insufficient balance for debit' });
    }
    const newBalance = Number(currentBalance) - Number(amount);

    const updatedUser = await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: balance_type === 'gift' ? { gift_balance: newBalance } : { balance: newBalance }
      }),
      prisma.transactions.create({
        data: {
          user_id: user.id,
          type: 'ADMIN_DEBIT',
          amount: amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: reason || 'Manual debit by admin'
        }
      })
    ]);

    await logActivity(user.id, 'admin debit', req, { amount, reason, balance_type });

    res.json(updatedUser[0]);
  } catch (error) {
    res.status(500).json({ error: 'Debit failed', details: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Nullify referrals
    await prisma.users.updateMany({ where: { referred_by: userId }, data: { referred_by: null } });

    // Manual cascade delete
    await prisma.transactions.deleteMany({ where: { user_id: userId } });
    await prisma.investments.deleteMany({ where: { user_id: userId } });
    await prisma.deposits.deleteMany({ where: { user_id: userId } });
    await prisma.withdrawals.deleteMany({ where: { user_id: userId } });
    await prisma.spin_logs.deleteMany({ where: { user_id: userId } });
    await prisma.user_checkins.deleteMany({ where: { user_id: userId } });
    await prisma.task_claims.deleteMany({ where: { user_id: userId } });
    await prisma.gift_code_claims.deleteMany({ where: { user_id: userId } });
    await prisma.referral_commissions.deleteMany({ where: { OR: [{ user_id: userId }, { from_user_id: userId }] } });
    await prisma.activity_logs.deleteMany({ where: { user_id: userId } });
    await prisma.email_logs.deleteMany({ where: { user_id: userId } });
    await prisma.user_spins.deleteMany({ where: { user_id: userId } });
    await prisma.password_resets.deleteMany({ where: { user_id: userId } });
    await prisma.investment_profits.deleteMany({ where: { user_id: userId } });
    
    // Finally, delete the user
    await prisma.users.delete({
      where: { id: userId }
    });
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

// Impersonate user
router.post('/:id/impersonate', async (req, res) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Generate a user token (same as what normal login generates)
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
    const token = jwt.default.sign({ id: user.id, email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '2h' });
    
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate impersonation token', details: error.message });
  }
});

export default router;

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
        username: true,
        balance: true,
        is_active: true,
        created_at: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      include: {
        country: true,
        language: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const depositsAggr = await prisma.deposits.aggregate({
      _sum: { amount: true },
      where: { user_id: req.user.id, status: 'APPROVED' }
    });

    const withdrawalsAggr = await prisma.withdrawals.aggregate({
      _sum: { amount: true },
      where: { user_id: req.user.id, status: 'APPROVED' }
    });

    const userTransactions = await prisma.transactions.findMany({
      where: { user_id: req.user.id }
    });
    
    let totalIncome = 0;
    for (const t of userTransactions) {
      if (t.type !== 'DEPOSIT' && t.type !== 'ADMIN_DEBIT') {
        if (parseFloat(t.balance_after) > parseFloat(t.balance_before)) {
           totalIncome += parseFloat(t.amount);
        }
      }
    }

    const teamMembersCount = await prisma.users.count({
      where: { referred_by: req.user.id }
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        balance: user.balance,
        gift_balance: user.gift_balance,
        country: user.country,
        language: user.language,
        referral_code: user.referral_code,
        statistics: {
          total_deposit: depositsAggr._sum.amount || 0,
          total_withdrawal: withdrawalsAggr._sum.amount || 0,
          total_income: totalIncome,
          team_members: teamMembersCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
  }
});

// Get user transactions
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const transactions = await prisma.transactions.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

// Update user language
router.put('/me/language', authenticate, async (req, res) => {
  try {
    const { language_code } = req.body;
    
    // Find the language by code
    const language = await prisma.languages.findUnique({
      where: { language_code }
    });

    if (!language) {
      return res.status(404).json({ success: false, error: 'Language not found' });
    }

    // Update user
    await prisma.users.update({
      where: { id: req.user.id },
      data: { language_id: language.id }
    });

    res.json({ success: true, message: 'Language updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update language' });
  }
});

// Get user's daily checkin status
router.get('/checkin', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.users.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.can_access_checkin) {
      return res.status(403).json({ error: 'Check-in feature is disabled for your account' });
    }

    // Get the global checkin rewards (ordered by day)
    const checkinConfig = await prisma.daily_checkins.findMany({
      where: { status: true },
      orderBy: { day_number: 'asc' }
    });

    if (checkinConfig.length === 0) {
      return res.json({ success: true, enabled: false, message: 'Daily checkin is currently unavailable' });
    }

    // Get user's claim history
    // We determine consecutive days by looking at the history
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    const history = await prisma.user_checkins.findMany({
      where: { user_id: userId },
      orderBy: { checkin_date: 'desc' },
      take: 7 // Only need recent to calculate streak
    });

    let currentStreak = 0;
    let claimedToday = false;
    let lastClaimDate = null;

    if (history.length > 0) {
      lastClaimDate = new Date(history[0].checkin_date);
      lastClaimDate.setHours(0, 0, 0, 0);

      if (lastClaimDate.getTime() === today.getTime()) {
        claimedToday = true;
        currentStreak = history[0].day_number;
      } else {
        // Check if yesterday was claimed
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastClaimDate.getTime() === yesterday.getTime()) {
          currentStreak = history[0].day_number;
        } else {
          // Streak broken
          currentStreak = 0;
        }
      }
    }

    // if max days reached, start over
    const maxDays = checkinConfig.length;
    let nextDayNumber = claimedToday ? currentStreak + 1 : currentStreak + 1;
    
    if (nextDayNumber > maxDays) {
      if (claimedToday) {
        // already claimed the last day today, waiting for tomorrow to reset
      } else {
        currentStreak = 0;
        nextDayNumber = 1;
      }
    }

    // Find the current reward to display
    const rewards = checkinConfig.map(config => ({
      day: config.day_number,
      amount: config.reward_amount,
      status: config.day_number <= currentStreak ? 'claimed' : (config.day_number === (claimedToday ? currentStreak : currentStreak + 1) ? (claimedToday ? 'claimed' : 'available') : 'locked')
    }));

    res.json({
      success: true,
      enabled: true,
      claimedToday,
      currentStreak,
      maxDays,
      rewards
    });

  } catch (error) {
    console.error('Checkin status error:', error);
    res.status(500).json({ error: 'Failed to fetch checkin status' });
  }
});

// Claim daily checkin
router.post('/checkin', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.users.findUnique({ where: { id: userId } });
    
    if (!user || !user.can_access_checkin) {
      return res.status(403).json({ error: 'Check-in is disabled' });
    }

    const checkinConfig = await prisma.daily_checkins.findMany({
      where: { status: true },
      orderBy: { day_number: 'asc' }
    });

    if (checkinConfig.length === 0) {
      return res.status(400).json({ error: 'Daily checkin is currently unavailable' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const history = await prisma.user_checkins.findMany({
      where: { user_id: userId },
      orderBy: { checkin_date: 'desc' },
      take: 1
    });

    let currentStreak = 0;
    if (history.length > 0) {
      const lastClaimDate = new Date(history[0].checkin_date);
      lastClaimDate.setHours(0, 0, 0, 0);

      if (lastClaimDate.getTime() === today.getTime()) {
        return res.status(400).json({ error: 'Already claimed today' });
      }

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastClaimDate.getTime() === yesterday.getTime()) {
        currentStreak = history[0].day_number;
      }
    }

    const maxDays = checkinConfig.length;
    let claimDay = currentStreak + 1;
    if (claimDay > maxDays) {
      claimDay = 1; // reset streak
    }

    const rewardConfig = checkinConfig.find(c => c.day_number === claimDay);
    if (!rewardConfig) {
      return res.status(400).json({ error: 'Reward configuration error' });
    }

    // Perform the claim in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create checkin record
      await tx.user_checkins.create({
        data: {
          user_id: userId,
          day_number: claimDay,
          reward_amount: rewardConfig.reward_amount,
          checkin_date: new Date()
        }
      });

      // 2. Add to user balance
      await tx.users.update({
        where: { id: userId },
        data: {
          balance: {
            increment: rewardConfig.reward_amount
          }
        }
      });

      // 3. Create transaction record
      const balanceBefore = user.balance;
      const balanceAfter = Number(user.balance) + Number(rewardConfig.reward_amount);

      await tx.transactions.create({
        data: {
          user_id: userId,
          type: 'daily_reward',
          amount: rewardConfig.reward_amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: `Daily check-in reward (Day ${claimDay})`
        }
      });
    });

    res.json({
      success: true,
      message: `Successfully claimed $${rewardConfig.reward_amount} for Day ${claimDay}`,
      amount: rewardConfig.reward_amount,
      day: claimDay
    });

  } catch (error) {
    console.error('Checkin claim error:', error);
    res.status(500).json({ error: 'Failed to claim reward' });
  }
});

export default router;

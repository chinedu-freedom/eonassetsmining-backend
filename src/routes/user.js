import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import bcrypt from 'bcrypt';
import { sendVerificationEmail } from '../lib/mailer.js';

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
        phone_number: user.phone_number,
        balance: user.balance,
        gift_balance: user.gift_balance,
        country: user.country,
        language: user.language,
        referral_code: user.referral_code,
        has_withdrawal_pin: !!user.withdrawal_pin,
        created_at: user.created_at,
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

// Get User Team Statistics
router.get('/team', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get platform settings for commissions
    const settings = await prisma.settings.findFirst();
    const l1Comm = parseFloat(settings?.level1_commission || 0);
    const l2Comm = parseFloat(settings?.level2_commission || 0);
    const l3Comm = parseFloat(settings?.level3_commission || 0);

    // Get Level 1 Users
    const level1Users = await prisma.users.findMany({
      where: { referred_by: userId },
      include: { investments: true }
    });
    const l1Ids = level1Users.map(u => u.id);

    // Get Level 2 Users
    let level2Users = [];
    if (l1Ids.length > 0) {
      level2Users = await prisma.users.findMany({
        where: { referred_by: { in: l1Ids } },
        include: { investments: true }
      });
    }
    const l2Ids = level2Users.map(u => u.id);

    // Get Level 3 Users
    let level3Users = [];
    if (l2Ids.length > 0) {
      level3Users = await prisma.users.findMany({
        where: { referred_by: { in: l2Ids } },
        include: { investments: true }
      });
    }
    
    // Count Valid members (those with at least one investment)
    const l1Valid = level1Users.filter(u => u.investments.length > 0).length;
    const l2Valid = level2Users.filter(u => u.investments.length > 0).length;
    const l3Valid = level3Users.filter(u => u.investments.length > 0).length;

    // Get Referral Commissions
    const commissions = await prisma.referral_commissions.findMany({
      where: { user_id: userId }
    });

    // Compute Earnings per Level
    const l1Earnings = commissions.filter(c => c.level === 1).reduce((acc, c) => acc + parseFloat(c.amount), 0);
    const l2Earnings = commissions.filter(c => c.level === 2).reduce((acc, c) => acc + parseFloat(c.amount), 0);
    const l3Earnings = commissions.filter(c => c.level === 3).reduce((acc, c) => acc + parseFloat(c.amount), 0);

    // Get Today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTeamMembers = [...level1Users, ...level2Users, ...level3Users];
    const newMembersToday = allTeamMembers.filter(u => new Date(u.created_at) >= today).length;
    
    const newEarningsToday = commissions
      .filter(c => new Date(c.created_at) >= today)
      .reduce((acc, c) => acc + parseFloat(c.amount), 0);

    res.json({
      success: true,
      data: {
        overview: {
          new_members_today: newMembersToday,
          new_earnings_today: newEarningsToday,
          total_team: allTeamMembers.length
        },
        levels: [
          {
            level: 1,
            total_members: level1Users.length,
            valid_members: l1Valid,
            commission_rate: l1Comm,
            total_earnings: l1Earnings
          },
          {
            level: 2,
            total_members: level2Users.length,
            valid_members: l2Valid,
            commission_rate: l2Comm,
            total_earnings: l2Earnings
          },
          {
            level: 3,
            total_members: level3Users.length,
            valid_members: l3Valid,
            commission_rate: l3Comm,
            total_earnings: l3Earnings
          }
        ]
      }
    });

  } catch (error) {
    console.error('Failed to fetch team stats:', error);
    res.status(500).json({ error: 'Failed to fetch team stats' });
  }
});

// Get User Team List By Level
router.get('/team/list', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const level = parseInt(req.query.level) || 1;

    let targetUsers = [];

    // Get Level 1
    const level1Users = await prisma.users.findMany({
      where: { referred_by: userId },
      include: { investments: true }
    });

    if (level === 1) {
      targetUsers = level1Users;
    } else {
      const l1Ids = level1Users.map(u => u.id);
      
      if (level === 2 && l1Ids.length > 0) {
        targetUsers = await prisma.users.findMany({
          where: { referred_by: { in: l1Ids } },
          include: { investments: true }
        });
      } else if (level === 3 && l1Ids.length > 0) {
        const level2Users = await prisma.users.findMany({
          where: { referred_by: { in: l1Ids } }
        });
        const l2Ids = level2Users.map(u => u.id);
        if (l2Ids.length > 0) {
          targetUsers = await prisma.users.findMany({
            where: { referred_by: { in: l2Ids } },
            include: { investments: true }
          });
        }
      }
    }

    // Map the users to include stats
    const formattedList = targetUsers.map(u => {
      const totalInvested = u.investments ? u.investments.reduce((acc, inv) => acc + parseFloat(inv.amount), 0) : 0;
      return {
        id: u.id,
        username: u.username || u.full_name || 'Anonymous',
        joined_at: u.created_at,
        status: u.is_active ? 'Active' : 'Inactive',
        balance: parseFloat(u.balance || 0),
        invested_amount: totalInvested
      };
    });

    res.json({
      success: true,
      data: formattedList
    });

  } catch (error) {
    console.error('Failed to fetch team list:', error);
    res.status(500).json({ error: 'Failed to fetch team list' });
  }
});

// Update Profile
router.put('/me/profile', authenticate, async (req, res) => {
  try {
    const { full_name, username, phone_number } = req.body;
    
    if (username) {
      const existing = await prisma.users.findFirst({ where: { username, id: { not: req.user.id } } });
      if (existing) return res.status(400).json({ success: false, error: 'Username is already taken' });
    }

    const updatedUser = await prisma.users.update({
      where: { id: req.user.id },
      data: { full_name, username, phone_number }
    });
    
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// Update Login Password
router.put('/me/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect current password' });

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }
    
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must contain both letters and numbers' });
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.password_hash);
    if (isSameAsOld) {
      return res.status(400).json({ success: false, message: 'New password cannot be the same as your current password' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    await prisma.users.update({
      where: { id: req.user.id },
      data: { password_hash: hash }
    });
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
});

// Update Withdrawal Pin
router.put('/me/payment', authenticate, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(newPassword, salt);
    
    await prisma.$executeRaw`UPDATE "users" SET "withdrawal_pin" = ${pinHash} WHERE "id" = ${req.user.id}::uuid`;
    
    res.json({ success: true, message: 'Withdrawal password set successfully' });
  } catch (error) {
    console.error('Set withdrawal pin error:', error);
    res.status(500).json({ success: false, message: 'Failed to set withdrawal password' });
  }
});

// Delete user account
router.delete('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
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
    await prisma.referral_commissions.deleteMany({ where: { OR: [{ earned_by: userId }, { given_by: userId }] } });
    await prisma.activity_logs.deleteMany({ where: { user_id: userId } });
    await prisma.email_logs.deleteMany({ where: { user_id: userId } });
    await prisma.user_spins.deleteMany({ where: { user_id: userId } });
    await prisma.password_resets.deleteMany({ where: { user_id: userId } });
    await prisma.investment_profits.deleteMany({ where: { user_id: userId } });
    
    // Now delete the user
    await prisma.users.delete({ where: { id: userId } });
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
});

// Send Verification Email
router.post('/me/send-verification', authenticate, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (user.email_verified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await prisma.users.update({
      where: { id: req.user.id },
      data: {
        verification_code: code,
        verification_expires: expiresAt
      }
    });

    const emailSent = await sendVerificationEmail({
      email: user.email,
      name: user.full_name,
      code: code
    });

    if (!emailSent.success) {
       return res.status(500).json({ success: false, message: 'Failed to send verification email. Try again later.' });
    }

    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to process verification request' });
  }
});

// Verify Email Code
router.post('/me/verify-email', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.email_verified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    if (user.verification_code !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    if (!user.verification_expires || new Date() > user.verification_expires) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    // Mark as verified and clear code
    await prisma.users.update({
      where: { id: req.user.id },
      data: {
        email_verified: true,
        verification_code: null,
        verification_expires: null
      }
    });

    res.json({ success: true, message: 'Email successfully verified' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify email' });
  }
});

export default router;



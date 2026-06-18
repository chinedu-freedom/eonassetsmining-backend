import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/stats', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      todayUsers,
      usersBalances,
      depositsStats,
      withdrawalsStats,
      investmentsStats,
      todayDepositsStats,
      todayWithdrawalsStats,
      todayInvestmentsStats
    ] = await Promise.all([
      // Users
      prisma.users.count(),
      prisma.users.count({ where: { status: 'ACTIVE' } }),
      prisma.users.count({ where: { created_at: { gte: todayStart } } }),
      prisma.users.aggregate({ _sum: { balance: true } }),

      // Deposits
      prisma.deposits.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true }
      }),

      // Withdrawals
      prisma.withdrawals.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true }
      }),

      // Investments
      prisma.investments.aggregate({
        where: { status: 'ACTIVE' },
        _count: true,
        _sum: { amount: true, expected_profit: true }
      }),

      // Today Deposits
      prisma.deposits.aggregate({
        where: { status: 'APPROVED', created_at: { gte: todayStart } },
        _sum: { amount: true }
      }),

      // Today Withdrawals
      prisma.withdrawals.aggregate({
        where: { status: 'APPROVED', created_at: { gte: todayStart } },
        _sum: { amount: true }
      }),

      // Today Investments
      prisma.investments.aggregate({
        where: { created_at: { gte: todayStart } },
        _sum: { amount: true }
      })
    ]);

    // Format deposits
    const depMap = { PENDING: { count: 0, sum: 0 }, APPROVED: { count: 0, sum: 0 } };
    depositsStats.forEach(d => {
      if (depMap[d.status]) {
        depMap[d.status].count = d._count || 0;
        depMap[d.status].sum = d._sum.amount || 0;
      }
    });

    // Format withdrawals
    const wdMap = { PENDING: { count: 0, sum: 0 }, APPROVED: { count: 0, sum: 0 } };
    withdrawalsStats.forEach(d => {
      if (wdMap[d.status]) {
        wdMap[d.status].count = d._count || 0;
        wdMap[d.status].sum = d._sum.amount || 0;
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        todayUsers,
        
        totalAssets: usersBalances._sum.balance || 0,
        assetsValue: (depMap.APPROVED.sum) + (usersBalances._sum.balance || 0), // Rough metric
        inProgressAssetsCount: investmentsStats._count || 0,
        inProgressAssetsSum: investmentsStats._sum.amount || 0,
        
        pendingDepositsCount: depMap.PENDING.count,
        approvedDepositsCount: depMap.APPROVED.count,
        pendingWithdrawalsCount: wdMap.PENDING.count,
        approvedWithdrawalsCount: wdMap.APPROVED.count,

        pendingDepositsSum: depMap.PENDING.sum,
        approvedDepositsSum: depMap.APPROVED.sum,
        pendingWithdrawalsSum: wdMap.PENDING.sum,
        approvedWithdrawalsSum: wdMap.APPROVED.sum,

        todayDepositsSum: todayDepositsStats._sum.amount || 0,
        todayWithdrawalsSum: todayWithdrawalsStats._sum.amount || 0,
        todayInvestmentsSum: todayInvestmentsStats._sum.amount || 0,
        
        totalInterestAmount: investmentsStats._sum.expected_profit || 0
      }
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
});

export default router;

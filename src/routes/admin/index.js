import { Router } from 'express';
import { requireAdmin, authenticate } from '../../middleware/auth.js';

import dashboardRoutes from './dashboard.js';
import usersRoutes from './users.js';
import plansRoutes from './plans.js';
import transactionsRoutes from './transactions.js';
import rewardsRoutes from './rewards.js';
import contentRoutes from './content.js';
import settingsRoutes from './settings.js';

const router = Router();

// Protect all admin routes with authentication and admin check
router.use(authenticate, requireAdmin);

router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/plans', plansRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/rewards', rewardsRoutes);
router.use('/content', contentRoutes);
router.use('/settings', settingsRoutes);

export default router;

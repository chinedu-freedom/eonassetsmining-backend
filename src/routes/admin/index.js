import { Router } from 'express';
import { requireAdmin, authenticate } from '../../middleware/auth.js';

import dashboardRoutes from './dashboard.js';
import usersRoutes from './users.js';
import plansRoutes from './plans.js';
import transactionsRoutes from './transactions.js';
import rewardsRoutes from './rewards.js';
import contentRoutes from './content.js';
import settingsRoutes from './settings.js';
import newsRoutes from './news.js';
import partnersRoutes from './partners.js';
import activitiesRoutes from './activities.js';
import slidersRoutes from './sliders.js';
import liveMarketRoutes from './live-market.js';
import countriesRoutes from './countries.js';
import languagesRoutes from './languages.js';
import aboutRoutes from './about.js';
import profileRoutes from './profile.js';

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
router.use('/news', newsRoutes);
router.use('/partners', partnersRoutes);
router.use('/activities', activitiesRoutes);
router.use('/sliders', slidersRoutes);
router.use('/live-market', liveMarketRoutes);
router.use('/countries', countriesRoutes);
router.use('/languages', languagesRoutes);
router.use('/about', aboutRoutes);
router.use('/profile', profileRoutes);

export default router;

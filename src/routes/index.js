import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import adminRoutes from './admin/index.js';
import newsRoutes from './news.js';
import partnersRoutes from './partners.js';
import slidersRoutes from './sliders.js';
import liveMarketRoutes from './live-market.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/news', newsRoutes);
router.use('/partners', partnersRoutes);
router.use('/sliders', slidersRoutes);
router.use('/live-market', liveMarketRoutes);

export default router;

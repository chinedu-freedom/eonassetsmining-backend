import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get active plans
router.get('/', async (req, res) => {
  try {
    const plans = await prisma.plans.findMany({
      where: {
        status: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

export default router;

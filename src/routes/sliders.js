import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get active sliders
router.get('/', async (req, res) => {
  try {
    const { display_location } = req.query;
    
    const where = {
      status: true
    };
    
    if (display_location) {
      where.display_location = display_location;
    }

    const sliders = await prisma.sliders.findMany({
      where,
      orderBy: { display_order: 'asc' }, // usually order by display_order for sliders
    });

    res.json({
      success: true,
      sliders
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch sliders' });
  }
});

export default router;

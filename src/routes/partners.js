import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get active partners for users
router.get('/', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    
    // Only show active partners
    const where = { status: true };
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [partners, total] = await Promise.all([
      prisma.partners.findMany({
        where,
        orderBy: { display_order: 'asc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          logo: true,
          partner_name: true,
        }
      }),
      prisma.partners.count({ where })
    ]);

    res.json({
      success: true,
      partners,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch partners', details: error.message });
  }
});

export default router;

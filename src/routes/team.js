import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get team members
router.get('/', async (req, res) => {
  try {
    const teamMembers = await prisma.team_members.findMany({
      orderBy: { display_order: 'asc' }
    });

    res.json({
      success: true,
      teamMembers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch team members' });
  }
});

export default router;

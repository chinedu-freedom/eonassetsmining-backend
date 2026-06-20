import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get about data (banners and team members)
router.get('/', async (req, res) => {
  try {
    // Ensure we have 5 banners (sliders) for the about page
    let banners = await prisma.sliders.findMany({
      where: { display_location: 'about' },
      orderBy: { display_order: 'asc' }
    });

    if (banners.length < 5) {
      const needed = 5 - banners.length;
      const newBanners = [];
      for (let i = 0; i < needed; i++) {
        newBanners.push({
          image: '',
          title: `Banner ${banners.length + i + 1}`,
          display_location: 'about',
          display_order: banners.length + i + 1
        });
      }
      await prisma.sliders.createMany({ data: newBanners });
      banners = await prisma.sliders.findMany({
        where: { display_location: 'about' },
        orderBy: { display_order: 'asc' }
      });
    }

    // Ensure we have 3 team members
    let teamMembers = await prisma.team_members.findMany({
      orderBy: { display_order: 'asc' }
    });

    if (teamMembers.length < 3) {
      const needed = 3 - teamMembers.length;
      const newTeamMembers = [];
      for (let i = 0; i < needed; i++) {
        newTeamMembers.push({
          image: '',
          name: `Team Member ${teamMembers.length + i + 1}`,
          position: 'Position',
          display_order: teamMembers.length + i + 1
        });
      }
      await prisma.team_members.createMany({ data: newTeamMembers });
      teamMembers = await prisma.team_members.findMany({
        orderBy: { display_order: 'asc' }
      });
    }

    res.json({ banners, teamMembers });
  } catch (error) {
    console.error("Fetch about error:", error);
    res.status(500).json({ error: 'Failed to fetch about data' });
  }
});

// Update banner
router.put('/banners/:id', async (req, res) => {
  try {
    const { image } = req.body;
    const banner = await prisma.sliders.update({
      where: { id: req.params.id },
      data: { image }
    });
    res.json(banner);
  } catch (error) {
    console.error("Update banner error:", error);
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

// Update team member
router.put('/team-members/:id', async (req, res) => {
  try {
    const { image, name, position } = req.body;
    const member = await prisma.team_members.update({
      where: { id: req.params.id },
      data: {
        ...(image !== undefined && { image }),
        ...(name !== undefined && { name }),
        ...(position !== undefined && { position })
      }
    });
    res.json(member);
  } catch (error) {
    console.error("Update team member error:", error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

export default router;

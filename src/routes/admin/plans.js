import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all plans
router.get('/', async (req, res) => {
  try {
    const plans = await prisma.plans.findMany({ orderBy: { created_at: 'desc' } });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Create new plan
router.post('/', async (req, res) => {
  try {
    const plan = await prisma.plans.create({ data: req.body });
    res.status(201).json({ message: 'Plan created successfully', success: true, plan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create plan', details: error.message });
  }
});

// Update plan
router.put('/:id', async (req, res) => {
  try {
    const plan = await prisma.plans.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ message: 'Plan updated successfully', success: true, plan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Delete plan
router.delete('/:id', async (req, res) => {
  try {
    await prisma.plans.delete({ where: { id: req.params.id } });
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

export default router;

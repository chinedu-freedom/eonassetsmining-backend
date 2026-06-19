import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper factory for simple CRUD
const createCrudRoutes = (modelName) => {
  const r = Router();
  
  r.get('/', async (req, res) => {
    try {
      const items = await prisma[modelName].findMany();
      res.json(items);
    } catch (e) {
      res.status(500).json({ error: `Failed to fetch ${modelName}` });
    }
  });

  r.post('/', async (req, res) => {
    try {
      const item = await prisma[modelName].create({ data: req.body });
      res.status(201).json(item);
    } catch (e) {
      res.status(500).json({ error: `Failed to create ${modelName}` });
    }
  });

  r.put('/:id', async (req, res) => {
    try {
      const item = await prisma[modelName].update({ where: { id: req.params.id }, data: req.body });
      res.json(item);
    } catch (e) {
      res.status(500).json({ error: `Failed to update ${modelName}` });
    }
  });

  r.delete('/:id', async (req, res) => {
    try {
      await prisma[modelName].delete({ where: { id: req.params.id } });
      res.json({ message: 'Deleted successfully' });
    } catch (e) {
      res.status(500).json({ error: `Failed to delete ${modelName}` });
    }
  });

  return r;
};

// Mount CRUD routes for content modules
router.use('/news', createCrudRoutes('news'));
router.use('/partners', createCrudRoutes('partners'));
router.use('/team', createCrudRoutes('team_members'));

// About Us (Single Record)
router.get('/about-us', async (req, res) => {
  try {
    const about = await prisma.about_us.findFirst();
    res.json(about || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch about us content' });
  }
});

router.put('/about-us', async (req, res) => {
  try {
    let about = await prisma.about_us.findFirst();
    if (about) {
      about = await prisma.about_us.update({ where: { id: about.id }, data: req.body });
    } else {
      about = await prisma.about_us.create({ data: req.body });
    }
    res.json(about);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update about us content' });
  }
});

export default router;

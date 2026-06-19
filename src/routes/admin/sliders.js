import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all sliders
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    
    // Build where clause based on filters
    const where = {};
    if (search) {
      where.OR = [
        { display_location: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status !== undefined && status !== 'all') {
      where.status = status === 'active';
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [sliders, total] = await Promise.all([
      prisma.sliders.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.sliders.count({ where })
    ]);

    res.json({
      success: true,
      sliders,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch sliders', details: error.message });
  }
});

// Get single slider item
router.get('/:id', async (req, res) => {
  try {
    const slider = await prisma.sliders.findUnique({
      where: { id: req.params.id }
    });
    
    if (!slider) {
      return res.status(404).json({ success: false, error: 'Slider not found' });
    }
    
    res.json({ success: true, slider });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch slider', details: error.message });
  }
});

// Create slider
router.post('/', async (req, res) => {
  try {
    const { image, title, display_location, status, display_order } = req.body;
    
    const newSlider = await prisma.sliders.create({
      data: {
        image,
        title,
        display_location,
        display_order: display_order || 0,
        status: status !== undefined ? status : true,
      }
    });
    
    res.status(201).json({ success: true, message: 'Slider created successfully', slider: newSlider });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create slider', details: error.message });
  }
});

// Update slider
router.put('/:id', async (req, res) => {
  try {
    const { image, title, display_location, status, display_order } = req.body;
    
    const updatedSlider = await prisma.sliders.update({
      where: { id: req.params.id },
      data: {
        ...(image !== undefined && { image }),
        ...(title !== undefined && { title }),
        ...(display_location !== undefined && { display_location }),
        ...(display_order !== undefined && { display_order }),
        ...(status !== undefined && { status }),
      }
    });
    
    res.json({ success: true, message: 'Slider updated successfully', slider: updatedSlider });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update slider', details: error.message });
  }
});

// Delete slider
router.delete('/:id', async (req, res) => {
  try {
    await prisma.sliders.delete({
      where: { id: req.params.id }
    });
    
    res.json({ success: true, message: 'Slider deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete slider', details: error.message });
  }
});

export default router;

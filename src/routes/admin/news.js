import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all news
router.get('/', async (req, res) => {
  try {
    const { search, category, is_featured, status, page = 1, limit = 10 } = req.query;
    
    // Build where clause based on filters
    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (is_featured !== undefined) where.is_featured = is_featured === 'true';
    if (status !== undefined) where.status = status === 'true';

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.news.count({ where })
    ]);

    res.json({
      success: true,
      news,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch news', details: error.message });
  }
});

// Get single news item
router.get('/:id', async (req, res) => {
  try {
    const newsItem = await prisma.news.findUnique({
      where: { id: req.params.id }
    });
    
    if (!newsItem) {
      return res.status(404).json({ success: false, error: 'News item not found' });
    }
    
    res.json({ success: true, news: newsItem });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch news item', details: error.message });
  }
});

// Create news
router.post('/', async (req, res) => {
  try {
    const { image, title, category, is_featured, description, content, status } = req.body;
    
    const newNews = await prisma.news.create({
      data: {
        image,
        title,
        category,
        is_featured: is_featured || false,
        description,
        content,
        status: status !== undefined ? status : true,
      }
    });
    
    res.status(201).json({ success: true, message: 'News created successfully', news: newNews });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create news', details: error.message });
  }
});

// Update news
router.put('/:id', async (req, res) => {
  try {
    const { image, title, category, is_featured, description, content, status } = req.body;
    
    const updatedNews = await prisma.news.update({
      where: { id: req.params.id },
      data: {
        ...(image !== undefined && { image }),
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(is_featured !== undefined && { is_featured }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status }),
      }
    });
    
    res.json({ success: true, message: 'News updated successfully', news: updatedNews });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update news', details: error.message });
  }
});

// Delete news
router.delete('/:id', async (req, res) => {
  try {
    await prisma.news.delete({
      where: { id: req.params.id }
    });
    
    res.json({ success: true, message: 'News deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete news', details: error.message });
  }
});

export default router;

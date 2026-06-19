import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get active news for users
router.get('/', async (req, res) => {
  try {
    const { category, is_featured, limit = 10, page = 1 } = req.query;
    
    // Build where clause based on filters, only showing active news
    const where = { status: true };
    
    if (category) where.category = category;
    if (is_featured !== undefined) where.is_featured = is_featured === 'true';

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { published_at: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          image: true,
          title: true,
          category: true,
          is_featured: true,
          description: true,
          content: true,
          views: true,
          published_at: true,
          created_at: true,
          updated_at: true,
        }
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

// Get single news item and increment views
router.get('/:id', async (req, res) => {
  try {
    const newsId = req.params.id;
    
    // First increment the view count
    await prisma.news.updateMany({
      where: { 
        id: newsId,
        status: true // Only allow viewing active news
      },
      data: {
        views: { increment: 1 }
      }
    });
    
    // Then fetch the updated news
    const newsItem = await prisma.news.findFirst({
      where: { 
        id: newsId,
        status: true
      }
    });
    
    if (!newsItem) {
      return res.status(404).json({ success: false, error: 'News item not found' });
    }
    
    res.json({ success: true, news: newsItem });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch news item', details: error.message });
  }
});

export default router;

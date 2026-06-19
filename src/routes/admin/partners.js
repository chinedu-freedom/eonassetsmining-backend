import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all partners
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    
    // Build where clause based on filters
    const where = {};
    if (search) {
      where.partner_name = { contains: search, mode: 'insensitive' };
    }
    if (status !== undefined) where.status = status === 'true';

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [partners, total] = await Promise.all([
      prisma.partners.findMany({
        where,
        orderBy: { display_order: 'asc' },
        skip,
        take: limitNum,
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

// Get single partner item
router.get('/:id', async (req, res) => {
  try {
    const partnerItem = await prisma.partners.findUnique({
      where: { id: req.params.id }
    });
    
    if (!partnerItem) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }
    
    res.json({ success: true, partner: partnerItem });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch partner', details: error.message });
  }
});

// Create partner
router.post('/', async (req, res) => {
  try {
    const { logo, partner_name, status, display_order } = req.body;
    
    const newPartner = await prisma.partners.create({
      data: {
        logo,
        partner_name,
        status: status !== undefined ? status : true,
        display_order: display_order || 0,
      }
    });
    
    res.status(201).json({ success: true, message: 'Partner created successfully', partner: newPartner });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create partner', details: error.message });
  }
});

// Update partner
router.put('/:id', async (req, res) => {
  try {
    const { logo, partner_name, status, display_order } = req.body;
    
    const updatedPartner = await prisma.partners.update({
      where: { id: req.params.id },
      data: {
        ...(logo !== undefined && { logo }),
        ...(partner_name !== undefined && { partner_name }),
        ...(status !== undefined && { status }),
        ...(display_order !== undefined && { display_order }),
      }
    });
    
    res.json({ success: true, message: 'Partner updated successfully', partner: updatedPartner });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update partner', details: error.message });
  }
});

// Delete partner
router.delete('/:id', async (req, res) => {
  try {
    await prisma.partners.delete({
      where: { id: req.params.id }
    });
    
    res.json({ success: true, message: 'Partner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete partner', details: error.message });
  }
});

export default router;

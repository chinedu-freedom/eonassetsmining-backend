import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all languages
router.get('/', async (req, res) => {
  try {
    const languages = await prisma.languages.findMany({
      orderBy: { sort_order: 'asc' }
    });
    res.json(languages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// Get single language
router.get('/:id', async (req, res) => {
  try {
    const language = await prisma.languages.findUnique({
      where: { id: req.params.id }
    });
    if (!language) return res.status(404).json({ error: 'Language not found' });
    res.json(language);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch language' });
  }
});

// Create language
router.post('/', async (req, res) => {
  try {
    const { language_code, language_name, native_name, flag_emoji, text_direction, sort_order, status } = req.body;
    
    // Check if there are any existing languages, if not, make this the default
    const existingCount = await prisma.languages.count();
    const is_default = existingCount === 0;

    const newLanguage = await prisma.languages.create({
      data: {
        language_code,
        language_name,
        native_name,
        flag_emoji,
        text_direction: text_direction || 'ltr',
        sort_order: Number(sort_order || 0),
        status: status === 'active' || status === true,
        is_default
      }
    });
    res.status(201).json(newLanguage);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Language code already exists' });
    }
    console.error("Create language error:", error);
    res.status(500).json({ error: 'Failed to create language' });
  }
});

// Update language
router.put('/:id', async (req, res) => {
  try {
    const { language_code, language_name, native_name, flag_emoji, text_direction, sort_order, status } = req.body;
    const updatedLanguage = await prisma.languages.update({
      where: { id: req.params.id },
      data: {
        language_code,
        language_name,
        native_name,
        flag_emoji,
        text_direction,
        sort_order: Number(sort_order || 0),
        status: status === 'active' || status === true
      }
    });
    res.json(updatedLanguage);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Language code already exists' });
    }
    console.error("Update language error:", error);
    res.status(500).json({ error: 'Failed to update language' });
  }
});

// Set as default language
router.patch('/:id/default', async (req, res) => {
  try {
    const targetLanguageId = req.params.id;

    // First unset all defaults
    await prisma.languages.updateMany({
      where: { is_default: true },
      data: { is_default: false }
    });

    // Set the target as default
    const updatedLanguage = await prisma.languages.update({
      where: { id: targetLanguageId },
      data: { is_default: true }
    });

    res.json(updatedLanguage);
  } catch (error) {
    console.error("Set default language error:", error);
    res.status(500).json({ error: 'Failed to set default language' });
  }
});

// Delete language
router.delete('/:id', async (req, res) => {
  try {
    const language = await prisma.languages.findUnique({ where: { id: req.params.id } });
    if (language?.is_default) {
      return res.status(400).json({ error: 'Cannot delete the default language. Set another language as default first.' });
    }

    await prisma.languages.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Language deleted successfully' });
  } catch (error) {
    console.error("Delete language error:", error);
    res.status(500).json({ error: 'Failed to delete language' });
  }
});

export default router;

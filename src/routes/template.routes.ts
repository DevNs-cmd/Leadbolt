import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all templates
router.get('/', async (req, res) => {
  try {
    const templates = await prisma.messageTemplate.findMany();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET single template
router.get('/:id', async (req, res) => {
  try {
    const template = await prisma.messageTemplate.findUnique({
      where: { id: req.params.id }
    });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST create template
router.post('/', async (req, res) => {
  try {
    const { name, type, subject, content, variables, isActive } = req.body;
    
    const template = await prisma.messageTemplate.create({
      data: {
        name,
        type: type || 'custom',
        subject,
        content,
        variables: Array.isArray(variables) ? JSON.stringify(variables) : variables,
        isActive: isActive !== undefined ? isActive : true,
      }
    });
    
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PUT update template
router.put('/:id', async (req, res) => {
  try {
    const { name, type, subject, content, variables, isActive } = req.body;
    
    const template = await prisma.messageTemplate.update({
      where: { id: req.params.id },
      data: {
        name,
        type,
        subject,
        content,
        variables: Array.isArray(variables) ? JSON.stringify(variables) : variables,
        isActive,
      }
    });
    
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE template
router.delete('/:id', async (req, res) => {
  try {
    await prisma.messageTemplate.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
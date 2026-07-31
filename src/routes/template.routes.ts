import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET - All templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = await prisma.messageTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST - Create template
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, subject, content, variables, isActive } = req.body;

    if (!name || !subject || !content) {
      return res.status(400).json({ 
        error: 'Name, subject, and content are required' 
      });
    }

    const template = await prisma.messageTemplate.create({
      data: {
        name,
        type: type || 'custom',
        subject,
        content,
        variables: variables || '[]',  // Store as JSON string
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// GET - Single template
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await prisma.messageTemplate.findUnique({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// PUT - Update template
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, type, subject, content, variables, isActive } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (subject !== undefined) updateData.subject = subject;
    if (content !== undefined) updateData.content = content;
    if (variables !== undefined) updateData.variables = variables;
    if (isActive !== undefined) updateData.isActive = isActive;

    const template = await prisma.messageTemplate.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE - Template
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.messageTemplate.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET lead by ID
router.get('/:id', async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// PUT update lead
router.put('/:id', async (req, res) => {
  try {
    const { email, phone, firstName, lastName, company, status, source, notes } = req.body;

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        email,
        phone,
        firstName,
        lastName,
        company,
        status,
        source,
        notes: typeof notes === 'object' ? JSON.stringify(notes) : notes,
      }
    });

    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// DELETE lead
router.delete('/:id', async (req, res) => {
  try {
    await prisma.lead.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;
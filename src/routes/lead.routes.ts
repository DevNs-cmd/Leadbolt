import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET - Single lead
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// PUT - Update lead
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { email, phone, firstName, lastName, company, status, source, notes } = req.body;

    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (company !== undefined) updateData.company = company;
    if (status !== undefined) updateData.status = status;
    if (source !== undefined) updateData.source = source;
    if (notes !== undefined) updateData.notes = notes;

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// DELETE - Lead
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.lead.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// GET - Lead messages
router.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const messages = await prisma.messageHistory.findMany({
      where: { leadId: req.params.id },
      orderBy: { sentAt: 'desc' },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching lead messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
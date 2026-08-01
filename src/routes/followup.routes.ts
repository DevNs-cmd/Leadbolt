import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST - Schedule follow-up
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { leadId, templateId, message, channel, scheduledAt } = req.body;

    if (!leadId || !scheduledAt) {
      return res.status(400).json({ error: 'Lead ID and scheduled time are required' });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        templateId: templateId || null,
        message: message || '',
        channel: channel || 'email',
        status: 'pending',
        scheduledAt: new Date(scheduledAt),
      }
    });

    res.status(201).json({
      success: true,
      followUp,
      message: `Follow-up scheduled for ${new Date(scheduledAt).toLocaleString()}`
    });
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    res.status(500).json({ error: 'Failed to schedule follow-up' });
  }
});

// GET - All pending follow-ups
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const followUps = await prisma.followUp.findMany({
      where: { 
        status: 'pending',
        scheduledAt: { lte: new Date() }
      },
      include: {
        lead: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
          }
        },
        template: true
      },
      orderBy: { scheduledAt: 'asc' }
    });

    res.json({ success: true, followUps });
  } catch (error) {
    console.error('Error fetching pending follow-ups:', error);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

// GET - Follow-ups for a lead
router.get('/lead/:leadId', async (req: Request, res: Response) => {
  try {
    const followUps = await prisma.followUp.findMany({
      where: { leadId: req.params.leadId },
      orderBy: { scheduledAt: 'desc' },
      include: {
        template: true
      }
    });

    res.json({ success: true, followUps });
  } catch (error) {
    console.error('Error fetching lead follow-ups:', error);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

// PUT - Update follow-up
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status, scheduledAt, message } = req.body;

    const followUp = await prisma.followUp.update({
      where: { id: req.params.id },
      data: {
        status: status || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        message: message || undefined,
      }
    });

    res.json({ success: true, followUp });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    res.status(500).json({ error: 'Failed to update follow-up' });
  }
});

// DELETE - Cancel follow-up
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.followUp.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Follow-up cancelled' });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    res.status(500).json({ error: 'Failed to delete follow-up' });
  }
});

export default router;
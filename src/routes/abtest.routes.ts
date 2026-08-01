import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient() as PrismaClient & {
  aBTest: any;
  aBTestResult: any;
  messageTemplate: any;
};

// POST - Create A/B test
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, templateIdA, templateIdB, channel, leadSegment } = req.body;

    if (!name || !templateIdA || !templateIdB) {
      return res.status(400).json({ error: 'Name and both template IDs are required' });
    }

    const templateA = await prisma.messageTemplate.findUnique({
      where: { id: templateIdA }
    });
    const templateB = await prisma.messageTemplate.findUnique({
      where: { id: templateIdB }
    });

    if (!templateA || !templateB) {
      return res.status(404).json({ error: 'One or both templates not found' });
    }

    const test = await prisma.aBTest.create({
      data: {
        name,
        description: description || '',
        templateIdA,
        templateIdB,
        channel: channel || 'email',
        leadSegment: leadSegment || 'all',
        status: 'draft',
      }
    });

    res.status(201).json({ success: true, test });
  } catch (error) {
    console.error('Error creating A/B test:', error);
    res.status(500).json({ error: 'Failed to create A/B test' });
  }
});

// GET - All A/B tests
router.get('/', async (req: Request, res: Response) => {
  try {
    const tests = await prisma.aBTest.findMany({
      include: {
        templateA: true,
        templateB: true,
        results: {
          include: {
            lead: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// GET - Single A/B test
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const test = await prisma.aBTest.findUnique({
      where: { id: req.params.id },
      include: {
        templateA: true,
        templateB: true,
        results: {
          include: {
            lead: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json({ success: true, test });
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ error: 'Failed to fetch test' });
  }
});

// PUT - Update A/B test
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status, winnerId } = req.body;

    const test = await prisma.aBTest.update({
      where: { id: req.params.id },
      data: {
        status: status || undefined,
        winnerId: winnerId || undefined,
      }
    });

    res.json({ success: true, test });
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ error: 'Failed to update test' });
  }
});

// POST - Record A/B test result
router.post('/:id/result', async (req: Request, res: Response) => {
  try {
    const { leadId, templateId, opened, clicked, replied } = req.body;

    if (!leadId || !templateId) {
      return res.status(400).json({ error: 'Lead ID and template ID are required' });
    }

    const result = await prisma.aBTestResult.create({
      data: {
        testId: req.params.id,
        leadId,
        templateId,
        opened: opened || false,
        clicked: clicked || false,
        replied: replied || false,
      }
    });

    res.status(201).json({ success: true, result });
  } catch (error) {
    console.error('Error recording result:', error);
    res.status(500).json({ error: 'Failed to record result' });
  }
});

// GET - Test results
router.get('/:id/results', async (req: Request, res: Response) => {
  try {
    const results = await prisma.aBTestResult.findMany({
      where: { testId: req.params.id },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Send message
router.post('/send', async (req, res) => {
  try {
    const { leadId, templateId, subject, content, channel, metadata } = req.body;

    if (!leadId || !content) {
      return res.status(400).json({ error: 'Lead ID and content are required' });
    }

    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Get template if provided
    let templateContent = content;
    let templateSubject = subject || 'No Subject';

    if (templateId) {
      const template = await prisma.messageTemplate.findUnique({
        where: { id: templateId }
      });

      if (template) {
        templateContent = template.content;
        templateSubject = template.subject;
      }
    }

    // Create message history
    const message = await prisma.messageHistory.create({
      data: {
        leadId,
        templateId: templateId || null,
        subject: templateSubject,
        content: templateContent,
        channel: channel || 'email',
        status: 'sent',
        sentAt: new Date(),
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    });

    // Simulate delivery (in production, this would be from your email provider)
    setTimeout(async () => {
      try {
        await prisma.messageHistory.update({
          where: { id: message.id },
          data: { 
            status: 'delivered',
            deliveredAt: new Date()
          }
        });
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    }, 2000);

    res.status(201).json({
      success: true,
      messageId: message.id,
      status: 'sent'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get message history
router.get('/history', async (req, res) => {
  try {
    const { leadId, status, channel, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (leadId) where.leadId = leadId as string;
    if (status) where.status = status as string;
    if (channel) where.channel = channel as string;

    const messages = await prisma.messageHistory.findMany({
      where,
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
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      },
      orderBy: { sentAt: 'desc' },
      skip: Number(offset),
      take: Number(limit),
    });

    const total = await prisma.messageHistory.count({ where });

    res.json({
      success: true,
      data: messages,
      pagination: { total, limit: Number(limit), offset: Number(offset) }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
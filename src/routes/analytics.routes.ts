import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaAny = prisma as any;
const followUpModel = prismaAny.followUp ?? prismaAny.followUps ?? null;

// GET - Overall analytics
router.get('/overview', async (req: Request, res: Response) => {
  try {
    // Get counts
    const totalLeads = await prisma.lead.count();
    const totalMessages = await prisma.messageHistory.count();
    const totalTemplates = await prisma.messageTemplate.count();
    const totalFollowUps = followUpModel ? await followUpModel.count() : 0;
    
    // Get delivered messages
    const deliveredMessages = await prisma.messageHistory.count({
      where: { status: 'delivered' }
    });

    // Messages by channel
    const byChannel = await prisma.messageHistory.groupBy({
      by: ['channel'],
      _count: true
    });

    // Messages by status
    const byStatus = await prisma.messageHistory.groupBy({
      by: ['status'],
      _count: true
    });

    // Follow-ups by status
    const followUpsByStatus = followUpModel
      ? await followUpModel.groupBy({
          by: ['status'],
          _count: true
        })
      : [];

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMessages = await prisma.messageHistory.count({
      where: {
        sentAt: { gte: sevenDaysAgo }
      }
    });

    const recentLeads = await prisma.lead.count({
      where: {
        createdAt: { gte: sevenDaysAgo }
      }
    });

    const deliveryRate = totalMessages > 0
      ? Number(((deliveredMessages / totalMessages) * 100).toFixed(2))
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalLeads,
          totalMessages,
          totalTemplates,
          totalFollowUps,
          deliveredMessages,
          deliveryRate,
        },
        byChannel,
        byStatus,
        followUpsByStatus,
        recentActivity: {
          last7Days: {
            messages: recentMessages,
            leads: recentLeads
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET - Lead analytics
router.get('/lead/:leadId', async (req: Request, res: Response) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.leadId },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' }
        },
        followUps: {
          orderBy: { scheduledAt: 'desc' }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const leadMessages = Array.isArray((lead as any).messages) ? (lead as any).messages : [];
    const leadFollowUps = Array.isArray((lead as any).followUps) ? (lead as any).followUps : [];

    const totalMessages = leadMessages.length;
    const deliveredMessages = leadMessages.filter((m: any) => m.status === 'delivered').length;
    const pendingFollowUps = leadFollowUps.filter((f: any) => f.status === 'pending').length;

    // Messages by channel for this lead
    const byChannel = leadMessages.reduce((acc: any, msg: any) => {
      acc[msg.channel] = (acc[msg.channel] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        lead: {
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          status: lead.status,
        },
        stats: {
          totalMessages,
          deliveredMessages,
          deliveryRate: totalMessages > 0 ? parseFloat((deliveredMessages / totalMessages * 100).toFixed(2)) : 0,
          pendingFollowUps,
        },
        byChannel,
        messages: leadMessages.slice(0, 10), // Last 10 messages
        followUps: leadFollowUps.slice(0, 5), // Last 5 follow-ups
      }
    });
  } catch (error) {
    console.error('Error fetching lead analytics:', error);
    res.status(500).json({ error: 'Failed to fetch lead analytics' });
  }
});

// GET - Template analytics
router.get('/template/:id', async (req: Request, res: Response) => {
  try {
    const template = await prisma.messageTemplate.findUnique({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Get all messages using this template
    const messages = await prisma.messageHistory.findMany({
      where: { templateId: req.params.id },
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
    });

    const totalUses = messages.length;
    const deliveredUses = messages.filter(m => m.status === 'delivered').length;
    
    // Messages by channel
    const byChannel = messages.reduce((acc: any, msg) => {
      acc[msg.channel] = (acc[msg.channel] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        template: {
          id: template.id,
          name: template.name,
          type: template.type,
          subject: template.subject,
        },
        stats: {
          totalUses,
          deliveredUses,
          successRate: totalUses > 0 ? parseFloat((deliveredUses / totalUses * 100).toFixed(2)) : 0,
          byChannel,
        },
        recentUses: messages.slice(0, 10),
      }
    });
  } catch (error) {
    console.error('Error fetching template analytics:', error);
    res.status(500).json({ error: 'Failed to fetch template analytics' });
  }
});

// GET - Channel analytics
router.get('/channel/:channel', async (req: Request, res: Response) => {
  try {
    const channel = req.params.channel;
    const validChannels = ['email', 'whatsapp', 'sms'];
    
    if (!validChannels.includes(channel)) {
      return res.status(400).json({ error: 'Invalid channel. Must be: email, whatsapp, or sms' });
    }

    const messages = await prisma.messageHistory.findMany({
      where: { channel },
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
      orderBy: { sentAt: 'desc' },
      take: 50
    });

    const total = await prisma.messageHistory.count({
      where: { channel }
    });

    const delivered = await prisma.messageHistory.count({
      where: { 
        channel,
        status: 'delivered'
      }
    });

    // Messages by status for this channel
    const byStatus = await prisma.messageHistory.groupBy({
      by: ['status'],
      where: { channel },
      _count: true
    });

    res.json({
      success: true,
      data: {
        channel,
        stats: {
          total,
          delivered,
          deliveryRate: total > 0 ? parseFloat((delivered / total * 100).toFixed(2)) : 0,
          byStatus,
        },
        recentMessages: messages.slice(0, 20),
      }
    });
  } catch (error) {
    console.error('Error fetching channel analytics:', error);
    res.status(500).json({ error: 'Failed to fetch channel analytics' });
  }
});

export default router;
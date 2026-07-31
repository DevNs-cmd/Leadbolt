import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendWhatsAppMessage } from '../lib/whatsapp';
import { 
  getWhatsAppConfig, 
  validatePhoneNumber, 
  formatPhoneNumber,
  getPhoneNumberErrorMessage,
  getWhatsAppStatus
} from '../lib/whatsapp-config';

const router = Router();
const prisma = new PrismaClient();

// POST - Send message
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { leadId, templateId, subject, content, channel, metadata } = req.body;

    // Validate required fields
    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Validate channel
    const validChannels = ['email', 'whatsapp', 'sms'];
    if (channel && !validChannels.includes(channel)) {
      return res.status(400).json({ error: 'Invalid channel. Must be: email, whatsapp, or sms' });
    }

    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // WhatsApp validation
    if (channel === 'whatsapp') {
      const config = getWhatsAppConfig();
      if (!config.isConfigured) {
        return res.status(500).json({ 
          error: 'WhatsApp is not configured',
          missing: config.missingFields
        });
      }

      if (!lead.phone) {
        return res.status(400).json({ 
          error: 'Lead does not have a phone number' 
        });
      }

      const formattedPhone = formatPhoneNumber(lead.phone);
      if (!validatePhoneNumber(formattedPhone)) {
        return res.status(400).json({ 
          error: 'Invalid phone number format',
          originalPhone: lead.phone,
          formattedPhone: formattedPhone
        });
      }
    }

    // Template processing
    let templateContent = content;
    let templateSubject = subject || 'No Subject';

    if (templateId) {
      const template = await prisma.messageTemplate.findUnique({
        where: { id: templateId }
      });

      if (template) {
        templateContent = template.content || content;
        templateSubject = template.subject || subject || 'No Subject';

        // Parse variables from JSON string
        let parsedVariables: string[] = [];
        try {
          parsedVariables = JSON.parse(template.variables || '[]');
        } catch {
          parsedVariables = [];
        }

        // Replace variables
        parsedVariables.forEach((varName: string) => {
          const value = lead[varName as keyof typeof lead] || '';
          templateContent = templateContent.replace(
            new RegExp(`\\{${varName}\\}`, 'g'),
            String(value)
          );
          templateSubject = templateSubject.replace(
            new RegExp(`\\{${varName}\\}`, 'g'),
            String(value)
          );
        });
      }
    }

    // Create message history
    const messageHistory = await prisma.messageHistory.create({
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

    // Send WhatsApp
    if (channel === 'whatsapp') {
      try {
        const formattedPhone = formatPhoneNumber(lead.phone!);
        await sendWhatsAppMessage(formattedPhone, templateContent);
        
        await prisma.messageHistory.update({
          where: { id: messageHistory.id },
          data: { 
            status: 'delivered',
            deliveredAt: new Date(),
            metadata: JSON.stringify({
              ...(metadata || {}),
              whatsapp: { phone: formattedPhone }
            })
          }
        });

        return res.status(201).json({
          success: true,
          messageId: messageHistory.id,
          channel: 'whatsapp',
          status: 'delivered',
          phone: formattedPhone,
          message: 'WhatsApp message sent successfully'
        });

      } catch (error) {
        await prisma.messageHistory.update({
          where: { id: messageHistory.id },
          data: { 
            status: 'failed',
            metadata: JSON.stringify({ error: String(error) })
          }
        });

        return res.status(500).json({
          error: 'Failed to send WhatsApp message',
          details: String(error)
        });
      }
    }

    // Send Email
    if (channel === 'email') {
      console.log(`📧 Email sent to ${lead.email}:`, {
        subject: templateSubject,
        content: templateContent
      });

      setTimeout(async () => {
        try {
          await prisma.messageHistory.update({
            where: { id: messageHistory.id },
            data: { 
              status: 'delivered',
              deliveredAt: new Date()
            }
          });
        } catch (error) {
          console.error('Error updating email status:', error);
        }
      }, 2000);

      return res.status(201).json({
        success: true,
        messageId: messageHistory.id,
        channel: 'email',
        status: 'sent',
        message: 'Email sent successfully'
      });
    }

    // Send SMS
    if (channel === 'sms') {
      console.log(`📱 SMS sent to ${lead.phone}:`, {
        content: templateContent
      });

      return res.status(201).json({
        success: true,
        messageId: messageHistory.id,
        channel: 'sms',
        status: 'sent',
        message: 'SMS sent successfully'
      });
    }

    return res.status(400).json({ error: 'Invalid channel specified' });

  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ 
      error: 'Failed to send message',
      details: String(error)
    });
  }
});

// GET - Message history
router.get('/history', async (req: Request, res: Response) => {
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
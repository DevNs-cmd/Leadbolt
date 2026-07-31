import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SendMessageRequest {
  leadId: string;
  templateId?: string;
  subject: string;
  content: string;
  channel: 'email' | 'whatsapp' | 'sms';
}

export interface MessageHistory {
  id: string;
  leadId: string;
  templateId?: string;
  subject: string;
  content: string;
  channel: 'email' | 'whatsapp' | 'sms';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  metadata?: Record<string, any>;
}

export class MessageService {
  // Send a message using template or custom content
  async sendMessage(data: SendMessageRequest): Promise<MessageHistory> {
    // First, get the lead
    const lead = await prisma.lead.findUnique({
      where: { id: data.leadId }
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Create message history
    const message = await prisma.messageHistory.create({
      data: {
        leadId: data.leadId,
        templateId: data.templateId,
        subject: data.subject,
        content: data.content,
        channel: data.channel,
        status: 'sent',
        sentAt: new Date(),
      }
    });

    return message;
  }

  // Get all messages for a lead
  async getLeadMessages(leadId: string): Promise<MessageHistory[]> {
    return await prisma.messageHistory.findMany({
      where: { leadId },
      orderBy: { sentAt: 'desc' }
    });
  }

  // Create a message template
  async createTemplate(data: {
    name: string;
    type: 'welcome' | 'follow-up' | 'custom';
    subject: string;
    content: string;
    variables: string[];
    isActive?: boolean;
  }) {
    // Since SQLite doesn't support arrays, store variables as JSON string
    return await prisma.messageTemplate.create({
      data: {
        name: data.name,
        type: data.type,
        subject: data.subject,
        content: data.content,
        variables: JSON.stringify(data.variables), // Convert array to JSON string for SQLite
        isActive: data.isActive ?? true,
      }
    });
  }

  // Get all active templates
  async getActiveTemplates() {
    return await prisma.messageTemplate.findMany({
      where: { isActive: true }
    });
  }

  // Update message status
  async updateMessageStatus(
    messageId: string, 
    status: 'sent' | 'delivered' | 'read' | 'failed'
  ) {
    const updateData: any = { status };
    
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    } else if (status === 'read') {
      updateData.readAt = new Date();
    }

    return await prisma.messageHistory.update({
      where: { id: messageId },
      data: updateData
    });
  }
}
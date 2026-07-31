import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // If you have authentication, uncomment these lines
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    const { leadId, templateId, subject, content, channel, metadata } = body;

    // Validate required fields
    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Validate channel
    const validChannels = ['email', 'whatsapp', 'sms'];
    if (channel && !validChannels.includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel. Must be: email, whatsapp, or sms' },
        { status: 400 }
      );
    }

    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // If templateId is provided, check if template exists
    let templateContent = content;
    let templateSubject = subject || 'No Subject';

    if (templateId) {
      const template = await prisma.messageTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      // Use template content if not overridden
      if (!content) {
        templateContent = template.content;
      }
      if (!subject) {
        templateSubject = template.subject;
      }

      // Replace variables in template (e.g., {firstName}, {lastName})
      let parsedVariables = [];
      if (typeof template.variables === 'string') {
        try {
          parsedVariables = JSON.parse(template.variables);
        } catch {
          parsedVariables = [];
        }
      }

      // Replace variables with lead data
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

    // Create message history entry
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

    // Simulate sending the message (replace with actual email/SMS service)
    console.log(`📧 Message sent to ${lead.email || lead.phone}:`, {
      subject: templateSubject,
      content: templateContent,
      channel: channel || 'email'
    });

    // Simulate delivery (in production, you'd get this from your email/SMS provider)
    // For now, we'll update to 'delivered' after a short delay
    setTimeout(async () => {
      try {
        await prisma.messageHistory.update({
          where: { id: messageHistory.id },
          data: { 
            status: 'delivered',
            deliveredAt: new Date()
          }
        });
        console.log(`✅ Message ${messageHistory.id} marked as delivered`);
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    }, 2000);

    // Return success response
    return NextResponse.json({
      success: true,
      messageId: messageHistory.id,
      leadId: leadId,
      subject: templateSubject,
      content: templateContent,
      channel: channel || 'email',
      status: 'sent',
      sentAt: messageHistory.sentAt,
      message: 'Message sent successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}
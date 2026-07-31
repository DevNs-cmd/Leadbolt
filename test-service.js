const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simple test without TypeScript
async function testMessageService() {
  try {
    console.log('🚀 Testing Message Service...\n');

    // 1. Create a lead
    const lead = await prisma.lead.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'new',
      },
    });
    console.log('✅ Lead created:', lead.id);

    // 2. Create a template
    const template = await prisma.messageTemplate.create({
      data: {
        name: 'Welcome Email',
        type: 'welcome',
        subject: 'Welcome to our platform!',
        content: 'Hello {firstName}, welcome to our platform!',
        variables: JSON.stringify(['firstName']),
        isActive: true,
      },
    });
    console.log('✅ Template created:', template.id);

    // 3. Send a message
    const message = await prisma.messageHistory.create({
      data: {
        leadId: lead.id,
        templateId: template.id,
        subject: template.subject,
        content: template.content.replace('{firstName}', lead.firstName || ''),
        channel: 'email',
        status: 'sent',
        sentAt: new Date(),
      },
    });
    console.log('✅ Message sent:', message.id);

    // 4. Update message status to delivered
    const updatedMessage = await prisma.messageHistory.update({
      where: { id: message.id },
      data: { 
        status: 'delivered',
        deliveredAt: new Date()
      },
    });
    console.log('✅ Message status updated to delivered');

    // 5. View all messages for the lead
    const messages = await prisma.messageHistory.findMany({
      where: { leadId: lead.id },
    });
    console.log('\n📧 All messages for lead:', messages);

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMessageService();
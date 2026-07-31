import { Router, Request, Response } from 'express';
import { checkWhatsAppConnection } from '../lib/whatsapp';
import { getWhatsAppConfig, getWhatsAppStatus } from '../lib/whatsapp-config';

const router = Router();

// GET - WhatsApp status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const config = getWhatsAppConfig();
    const status = getWhatsAppStatus();
    
    // Check actual connection
    const connection = await checkWhatsAppConnection();
    
    res.json({
      configured: config.isConfigured,
      config: {
        accountId: config.accountId ? 'configured' : 'missing',
        authToken: config.authToken ? 'configured' : 'missing',
        fromNumber: config.fromNumber ? 'configured' : 'missing',
        webhookToken: config.webhookToken ? 'configured' : 'missing',
      },
      status: status.status,
      message: status.message,
      connection: connection,
      endpoints: [
        'GET /api/whatsapp/status',
        'POST /api/whatsapp/send-test',
        'GET /api/whatsapp/test-config'
      ]
    });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    res.status(500).json({ 
      error: 'Failed to get WhatsApp status',
      details: String(error)
    });
  }
});

// POST - Test WhatsApp message
router.post('/send-test', async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ 
        error: 'Phone number (to) and message are required' 
      });
    }
    
    const { sendWhatsAppMessage } = await import('../lib/whatsapp');
    const { formatPhoneNumber, validatePhoneNumber } = await import('../lib/whatsapp-config');
    
    const formattedPhone = formatPhoneNumber(to);
    if (!validatePhoneNumber(formattedPhone)) {
      return res.status(400).json({
        error: 'Invalid phone number format',
        original: to,
        formatted: formattedPhone
      });
    }
    
    const result = await sendWhatsAppMessage(formattedPhone, message);
    
    res.json({
      success: true,
      to: formattedPhone,
      message: message,
      result: result
    });
  } catch (error) {
    console.error('WhatsApp test send error:', error);
    res.status(500).json({ 
      error: 'Failed to send test message',
      details: String(error)
    });
  }
});

// GET - Test configuration
router.get('/test-config', async (req: Request, res: Response) => {
  try {
    const config = getWhatsAppConfig();
    const status = getWhatsAppStatus();
    
    // Test phone number formatting
    const testNumbers = [
      '1234567890',
      '+1234567890',
      '(123) 456-7890',
      'invalid-number'
    ];
    
    const { formatPhoneNumber, validatePhoneNumber } = await import('../lib/whatsapp-config');
    
    const formattedNumbers = testNumbers.map(num => ({
      original: num,
      formatted: formatPhoneNumber(num),
      valid: validatePhoneNumber(formatPhoneNumber(num))
    }));
    
    res.json({
      config: {
        accountId: config.accountId ? 'configured' : 'missing',
        authToken: config.authToken ? 'configured' : 'missing',
        fromNumber: config.fromNumber ? 'configured' : 'missing',
        isConfigured: config.isConfigured,
      },
      status,
      phoneNumberTests: formattedNumbers,
      environment: {
        hasAccountId: !!process.env.WHATSAPP_ACCOUNT_ID,
        hasApiToken: !!process.env.WHATSAPP_API_TOKEN,
        hasPhoneId: !!process.env.WHATSAPP_PHONE_ID,
      }
    });
  } catch (error) {
    console.error('WhatsApp config test error:', error);
    res.status(500).json({ 
      error: 'Failed to test configuration',
      details: String(error)
    });
  }
});

export default router;
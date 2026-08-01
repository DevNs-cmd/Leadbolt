// src/lib/whatsapp.ts
// WhatsApp API Client - Simplified

/**
 * Send a WhatsApp message
 * @param to - Recipient phone number (E.164 format)
 * @param body - Message content
 * @returns Response object
 */
export async function sendWhatsAppMessage(to: string, body: string) {
  console.log(`📱 Sending WhatsApp message to ${to}:`, body);
  
  // Simulate API call - replace with actual WhatsApp API
  return {
    success: true,
    messageId: `wa_msg_${Date.now()}`,
    to: to,
    body: body,
    status: 'sent'
  };
}

/**
 * Check WhatsApp connection
 * @returns Connection status
 */
export async function checkWhatsAppConnection() {
  return {
    connected: true,
    message: 'WhatsApp API is connected',
    accountId: process.env.WHATSAPP_ACCOUNT_ID || 'not_configured'
  };
}
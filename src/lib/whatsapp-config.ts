// src/lib/whatsapp-config.ts
// WhatsApp Configuration Helper

export function getWhatsAppConfig() {
  const accountId = process.env.WHATSAPP_ACCOUNT_ID;
  const authToken = process.env.WHATSAPP_API_TOKEN;
  const fromNumber = process.env.WHATSAPP_PHONE_ID;
  const webhookToken = process.env.WHATSAPP_WEBHOOK_TOKEN;

  return {
    accountId: accountId || '',
    authToken: authToken || '',
    fromNumber: fromNumber || '',
    webhookToken: webhookToken || '',
    isConfigured: !!(accountId && authToken && fromNumber),
    missingFields: []
  };
}

export function validatePhoneNumber(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone.trim());
}

export function formatPhoneNumber(phone: string, countryCode: string = "1"): string {
  if (!phone || phone.trim().length === 0) {
    return '';
  }

  const cleaned = phone.replace(/\D/g, "");
  
  if (phone.trim().startsWith('+')) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 2 && digits.length <= 15) {
      return `+${digits}`;
    }
  }
  
  if (cleaned.length === 10) {
    return `+${countryCode}${cleaned}`;
  }
  
  if (cleaned.length > 10 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }
  
  return `+${cleaned}`;
}

export function getPhoneNumberErrorMessage(phone: string): string {
  if (!phone || phone.trim().length === 0) {
    return 'Phone number is required';
  }
  
  const formatted = formatPhoneNumber(phone);
  
  if (!validatePhoneNumber(formatted)) {
    if (!phone.startsWith('+')) {
      return 'Phone number must start with + and country code (e.g., +1234567890)';
    }
    return 'Invalid phone number format. Please use E.164 format (e.g., +1234567890)';
  }
  
  return '';
}

export function getWhatsAppStatus() {
  const config = getWhatsAppConfig();
  
  if (config.isConfigured) {
    return {
      status: 'connected',
      message: 'WhatsApp is configured and ready to use',
      details: 'All credentials are configured'
    };
  }
  
  return {
    status: 'disconnected',
    message: 'WhatsApp is not fully configured',
    details: 'Missing required environment variables'
  };
}
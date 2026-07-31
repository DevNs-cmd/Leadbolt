export interface MessageTemplate {
  id: string;
  name: string;
  type: 'welcome' | 'follow-up' | 'custom';
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface SendMessageRequest {
  leadId: string;
  templateId?: string;
  subject: string;
  content: string;
  channel: 'email' | 'whatsapp' | 'sms';
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Mail, MessageSquare } from 'lucide-react';

const TEMPLATES = {
  welcome: {
    id: 'welcome',
    name: '👋 Welcome Message',
    type: 'email',
    subject: 'Welcome to LeadBolt! 🎉',
    body: `Hi {{name}},

Welcome to LeadBolt! We're excited to help you grow your business.

Best,
The LeadBolt Team`
  },
  follow_up: {
    id: 'follow_up',
    name: '📅 Follow-up Check',
    type: 'email',
    subject: 'Following up on your interest',
    body: `Hi {{name}},

I wanted to follow up on our previous conversation.

Best,
Your Sales Team`
  },
  whatsapp_welcome: {
    id: 'whatsapp_welcome',
    name: '💬 WhatsApp Welcome',
    type: 'whatsapp',
    body: `Hi {{name}}! 👋

Welcome to LeadBolt!`
  }
};

export function MessageTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('welcome');
  const [message, setMessage] = useState(TEMPLATES.welcome.body);
  const [subject, setSubject] = useState(TEMPLATES.welcome.subject || '');
  const [leadName, setLeadName] = useState('John Doe');

  const getPreview = () => {
    return message.replace(/{{name}}/g, leadName);
  };

  const handleSend = async (channel: 'email' | 'whatsapp') => {
    const payload = {
      templateId: selectedTemplate,
      to: 'lead@example.com',
      subject: subject,
      message: getPreview(),
      channel: channel
    };

    try {
      const response = await fetch('http://localhost:8000/api/outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      alert(`✅ Message sent via ${channel}!`);
      console.log('Response:', data);
    } catch (error) {
      alert('❌ Failed to send message. Check backend.');
      console.error('Error:', error);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-bold text-lg text-purple-800 mb-3">📝 Message Templates</h3>
      
      <div className="space-y-3">
        <select
          className="w-full p-2 border rounded"
          value={selectedTemplate}
          onChange={(e) => {
            setSelectedTemplate(e.target.value);
            const template = TEMPLATES[e.target.value as keyof typeof TEMPLATES];
            setMessage(template.body);
            setSubject(template.subject || '');
          }}
        >
          {Object.entries(TEMPLATES).map(([key, template]) => (
            <option key={key} value={key}>{template.name}</option>
          ))}
        </select>
        
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
        />
        
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
        />
        
        <input
          type="text"
          className="w-full p-2 border rounded text-sm"
          value={leadName}
          onChange={(e) => setLeadName(e.target.value)}
          placeholder="Lead name for preview"
        />
        
        <div className="bg-gray-50 p-3 rounded text-sm">
          Preview: {getPreview()}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => handleSend('email')} className="bg-blue-600 hover:bg-blue-700">
            <Mail className="w-4 h-4 mr-2" /> Email
          </Button>
          <Button onClick={() => handleSend('whatsapp')} className="bg-green-600 hover:bg-green-700">
            <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
        </div>
      </div>
    </Card>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send, MessageSquare } from 'lucide-react';

// Simple Select component
const SimpleSelect = ({ value, onChange, options }: any) => (
  <select 
    value={value} 
    onChange={(e) => onChange(e.target.value)}
    className="w-full p-2 border rounded-md bg-white"
  >
    {options.map((opt: any) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  score: number;
}

export function LeadDetail({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({
    subject: '',
    content: '',
    channel: 'email',
    templateId: ''
  });

  useEffect(() => {
    fetchLead();
    fetchTemplates();
  }, [leadId]);

  const fetchLead = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}`);
      if (response.ok) {
        const data = await response.json();
        setLead(data);
        setMessage(prev => ({
          ...prev,
          content: `Hi ${data.name},\n\n`
        }));
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/message-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.content.trim()) {
      toast.error('Message content is required');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: leadId,
          templateId: message.templateId || undefined,
          subject: message.subject || 'Message from LeadBolt',
          content: message.content,
          channel: message.channel
        })
      });

      if (response.ok) {
        toast.success('Message sent successfully');
        setIsDialogOpen(false);
        setMessage({
          subject: '',
          content: `Hi ${lead?.name},\n\n`,
          channel: 'email',
          templateId: ''
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(prev => ({
        ...prev,
        templateId: template.id,
        subject: template.subject,
        content: template.content
          .replace(/{{\s*name\s*}}/g, lead?.name || 'Customer')
          .replace(/{{\s*company\s*}}/g, lead?.company || 'your company')
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Lead Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{lead.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  lead.status === 'qualified' ? 'bg-green-100 text-green-700' :
                  lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {lead.status}
                </span>
                <span className="text-sm text-gray-500">
                  Score: <span className="font-semibold text-purple-600">{lead.score}</span>
                </span>
              </div>
            </div>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{lead.email}</p>
            </div>
            {lead.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{lead.phone}</p>
              </div>
            )}
            {lead.company && (
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium">{lead.company}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          <div id="message-history-container">
            {/* Message history will be displayed here */}
            <p className="text-gray-500 text-sm">Messages will appear here</p>
          </div>
        </CardContent>
      </Card>

      {/* Send Message Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Send Message to {lead.name}
              </h2>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Channel</label>
                <SimpleSelect
                  value={message.channel}
                  onChange={(value) => setMessage({ ...message, channel: value })}
                  options={[
                    { value: 'email', label: '📧 Email' },
                    { value: 'whatsapp', label: '💬 WhatsApp' },
                    { value: 'sms', label: '📱 SMS' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Template (Optional)</label>
                <SimpleSelect
                  value={message.templateId || ''}
                  onChange={handleTemplateSelect}
                  options={[
                    { value: '', label: 'None' },
                    ...templates.map((t: any) => ({ value: t.id, label: t.name }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <Input
                  value={message.subject}
                  onChange={(e) => setMessage({ ...message, subject: e.target.value })}
                  placeholder="Email subject line"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <Textarea
                  value={message.content}
                  onChange={(e) => setMessage({ ...message, content: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="Type your message here..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleSendMessage}
                  disabled={isSending}
                >
                  {isSending ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
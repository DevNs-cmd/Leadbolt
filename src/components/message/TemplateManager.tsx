'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Copy, Trash2, Mail } from 'lucide-react';

// Simple Select component (if you don't have shadcn/ui)
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

interface Template {
  id: string;
  name: string;
  type: string;
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'welcome',
    subject: '',
    content: '',
    variables: [] as string[]
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/message-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/message-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });

      if (response.ok) {
        toast.success('Template created successfully');
        setIsCreating(false);
        setNewTemplate({ name: '', type: 'welcome', subject: '', content: '', variables: [] });
        fetchTemplates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/message-templates/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Message Templates</h2>
          <p className="text-gray-500 text-sm">Create and manage reusable message templates</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? 'Cancel' : 'New Template'}
        </Button>
      </div>

      {isCreating && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg">Create New Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Template Name *</label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Welcome Email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <SimpleSelect
                    value={newTemplate.type}
                    onChange={(value) => setNewTemplate({ ...newTemplate, type: value })}
                    options={[
                      { value: 'welcome', label: 'Welcome' },
                      { value: 'follow-up', label: 'Follow-up' },
                      { value: 'custom', label: 'Custom' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <Input
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  placeholder="Email subject line"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content *</label>
                <Textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="Message content. Use {{variable}} for dynamic content"
                  rows={6}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Use {'{{name}}'}, {'{{company}}'}, {'{{email}}'} for personalization
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Variables (comma separated)</label>
                <Input
                  value={newTemplate.variables.join(', ')}
                  onChange={(e) => setNewTemplate({ 
                    ...newTemplate, 
                    variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                  })}
                  placeholder="name, company, email"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setIsCreating(false);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTemplate}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {loading ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-gray-50 rounded-lg">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No templates yet</h3>
            <p className="text-gray-400 text-sm">Create your first message template</p>
          </div>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        template.type === 'welcome' ? 'bg-green-100 text-green-700' :
                        template.type === 'follow-up' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {template.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold text-gray-700">{template.subject}</p>
                <p className="text-sm text-gray-600 mt-2 line-clamp-3 whitespace-pre-wrap">
                  {template.content}
                </p>
                {template.variables.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.variables.map((varName) => (
                      <span key={varName} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {'{{'}{varName}{'}}'}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
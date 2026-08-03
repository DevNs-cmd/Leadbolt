'use client';

import { useState } from 'react';
import { AutomationRules } from '@/app/components/outreach/AutomationRules';
import { MessageHistory } from '@/app/components/outreach/MessageHistory';
import { MessageTemplates } from '@/app/components/outreach/MessageTemplates';
import { Button } from '@/components/ui';

const TABS = [
  { id: 'templates', label: 'Message Templates' },
  { id: 'history', label: 'Message History' },
  { id: 'automation', label: 'Automation Rules' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function OutreachPage() {
  const [activeTab, setActiveTab] = useState<TabId>('templates');

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-800 mb-6">📱 LeadBolt Outreach</h1>

        <div className="flex gap-2 mb-6">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === 'templates' && <MessageTemplates />}
        {activeTab === 'history' && <MessageHistory />}
        {activeTab === 'automation' && <AutomationRules />}
      </div>
    </div>
  );
}

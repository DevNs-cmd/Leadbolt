'use client';

import { MessageTemplates } from '@/app/components/outreach/MessageTemplates';
import { MessageHistory } from '@/app/components/outreach/MessageHistory';
import { AutomationRules } from '@/app/components/outreach/AutomationRules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-800 mb-6">📱 LeadBolt Outreach</h1>
        
        <Tabs defaultValue="templates">
          <TabsList className="bg-white">
            <TabsTrigger value="templates">📝 Templates</TabsTrigger>
            <TabsTrigger value="history">📋 History</TabsTrigger>
            <TabsTrigger value="automation">⚡ Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <MessageTemplates />
          </TabsContent>
          <TabsContent value="history">
            <MessageHistory />
          </TabsContent>
          <TabsContent value="automation">
            <AutomationRules />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
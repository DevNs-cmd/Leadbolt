'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';

export function AutomationRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/outreach/automation');
      const data = await response.json();
      setRules(data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const toggleRule = (id: number) => {
    setRules(rules.map((rule: any) =>
      rule.id === id ? { ...rule, active: !rule.active } : rule
    ));
  };

  if (loading) {
    return <Card className="p-4"><div className="text-center">Loading...</div></Card>;
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-purple-800">⚡ Automation Rules</h3>
        <Button size="sm" className="bg-purple-600">
          <Plus className="w-4 h-4 mr-1" /> New Rule
        </Button>
      </div>
      
      {rules.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No automation rules yet</p>
        </div>
      ) : (
        rules.map((rule: any) => (
          <div key={rule.id} className="border rounded p-3 mb-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{rule.name}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                  {rule.active ? 'Active' : 'Inactive'}
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Trigger: {rule.trigger} • Delay: {rule.delay} • Channel: {rule.channel}
                </p>
              </div>
              <Switch checked={rule.active} onCheckedChange={() => toggleRule(rule.id)} />
            </div>
          </div>
        ))
      )}
    </Card>
  );
}
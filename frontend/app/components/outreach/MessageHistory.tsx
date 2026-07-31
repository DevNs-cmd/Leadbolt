'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Mail, MessageSquare } from 'lucide-react';

export function MessageHistory() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/outreach/history');
      const data = await response.json();
      setMessages(data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <Card className="p-4"><div className="text-center">Loading...</div></Card>;
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-purple-800">📋 Message History</h3>
        <button onClick={fetchMessages} className="text-sm text-purple-600">Refresh</button>
      </div>
      
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No messages sent yet</p>
        </div>
      ) : (
        messages.map((msg: any) => (
          <div key={msg.id} className="border rounded p-3 mb-2">
            <div className="flex items-center gap-2">
              {msg.channel === 'email' ? <Mail className="w-4 h-4 text-blue-500" /> : <MessageSquare className="w-4 h-4 text-green-500" />}
              <span className="font-medium">{msg.to}</span>
              <span className="text-xs text-gray-400">{new Date(msg.sent_at).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{msg.body}</p>
            <span className="text-xs text-gray-400">Status: {msg.status}</span>
          </div>
        ))
      )}
    </Card>
  );
}
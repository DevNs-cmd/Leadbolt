import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import templateRoutes from './routes/template.routes';
import messageRoutes from './routes/messages.routes';
import leadRoutes from './routes/lead.routes';
import whatsappRoutes from './routes/whatsapp.routes';  // ✅ Add this
import followupRoutes from './routes/followup.routes';
import abTestRoutes from './routes/abtest.routes';
import analyticsRoutes from './routes/analytics.routes';



dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/message-templates', templateRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/whatsapp', whatsappRoutes);  // ✅ Add this
app.use('/api/followups', followupRoutes);
app.use('/api/ab-tests', abTestRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'LeadBolt API is running!',
    endpoints: [
      'GET /api/health',
      'GET /api/test',
      'GET /api/message-templates',
      'POST /api/message-templates',
      'GET /api/message-templates/:id',
      'PUT /api/message-templates/:id',
      'DELETE /api/message-templates/:id',
      'POST /api/messages/send',
      'GET /api/messages/history',
      'GET /api/leads/:id',
      'PUT /api/leads/:id',
      'DELETE /api/leads/:id',
      'GET /api/leads/:id/messages',
      'GET /api/whatsapp/status',
      'POST /api/whatsapp/send-test',
      'GET /api/whatsapp/test-config',
      'POST /api/followups/schedule',
      'GET /api/followups/pending',
      'GET /api/followups/lead/:leadId',
      'PUT /api/followups/:id',
      'DELETE /api/followups/:id'
    ]
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Prisma Studio: http://localhost:5555`);
  console.log(`📝 Test the API: http://localhost:${port}/api/test`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Disconnected from database');
  process.exit(0);
});
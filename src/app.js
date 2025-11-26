// src/app.js veya src/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import complaintsRoutes from './complaints/complaintsRoutes.js';
// import dashboardRoutes from './routes/dashboardRoutes.js';
// import announcementRoutes from './routes/announcementRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============= Middleware =============

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (frontend)
app.use(express.static('public'));

// Request logger (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============= API Routes =============

app.use('/api/complaints', complaintsRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/announcements', announcementRoutes);

// ============= Health Check =============

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Documentation (basit)
app.get('/api', (req, res) => {
  res.json({
    message: 'Site Yönetim Sistemi API',
    version: '1.0.0',
    endpoints: {
      complaints: {
        base: '/api/complaints',
        endpoints: [
          'GET    /api/complaints?siteId=1&status=pending',
          'GET    /api/complaints/user/:userId?siteId=1',
          'GET    /api/complaints/:id',
          'POST   /api/complaints',
          'PATCH  /api/complaints/:id/status',
          'DELETE /api/complaints/:id',
          'GET    /api/complaints/stats/:siteId'
        ]
      }
    }
  });
});

// ============= Error Handling =============

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint bulunamadı',
    path: req.path
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Sunucu hatası',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============= Server Start =============

app.listen(PORT, () => {
  console.log('🚀 Server running on port', PORT);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`📝 Complaints: http://localhost:${PORT}/api/complaints`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('Press CTRL+C to stop');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

export default app;
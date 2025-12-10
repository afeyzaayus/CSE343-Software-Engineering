import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';


// Auth Routes
import adminRoutes from './modules/auth/routes/admin.routes.js';
import userRoutes from './modules/auth/routes/user.routes.js';
import passwordResetRoutes from './modules/auth/routes/passwordReset.routes.js';
import siteRoutes from './modules/site/site.routes.js';

// Module Routes
import companyRoutes from './modules/company/routes/company.routes.js';
import accountRoutes from './modules/account/account.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import announcementRoutes from './modules/announcement/announcement.routes.js';
import invitationRoutes from './modules/company/routes/invitation.routes.js';
import paymentRoutes from './modules/payment/routes/payment.routes.js';
import requestRoutes from './modules/request/request.routes.js';
import residenceRoutes from './modules/residence/residence.routes.js';
import socialFacilitiesRoutes from './modules/social-facilities/social-facilities.routes.js';

import masterRoutes from './modules/master/masterUser.routes.js';
import { seedMasterAdmin } from './modules/master/masterUser.service.js';

// .env dosyasını yükle
dotenv.config();

const prisma = new PrismaClient();

// Veritabanı bağlantısını test et ve master admin oluştur
(async () => {
  try {
    await seedMasterAdmin(); // program çalışınca otomatik superadmin
    console.log('✅ Master admin kontrolü tamamlandı');
  } catch (error) {
    console.error('⚠️  Master admin oluşturulamadı:', error.message);
    console.log('Sunucu veritabanı bağlantısı olmadan çalışmaya devam ediyor...');
  }
})();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// frontend klasörünün public yolu
const frontendPublicPath = path.join(__dirname, '..', '..', 'frontend', 'public');

// Tüm frontend dosyalarını servis et
app.use(express.static(frontendPublicPath));

// Frontend Route Handler - Tüm HTML sayfalarını otomatik servis et
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(frontendPublicPath, 'dashboard.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(frontendPublicPath, 'login.html'));
});

app.get('/announcements', (req, res) => {
    res.sendFile(path.join(frontendPublicPath, 'announcements.html'));
});

app.get('/payment', (req, res) => {
    res.sendFile(path.join(frontendPublicPath, 'payment.html'));
});

app.get('/complaints', (req, res) => {
    res.sendFile(path.join(frontendPublicPath, 'complaint_request.html'));
});

app.get('/residents', (req, res) => {
    res.sendFile(path.join(frontendPublicPath, 'residents.html'));
});

app.get('/social-facilities', (req, res) => {
    res.sendFile(path.join(frontendPublicPath, 'socialfacilities.html'));
});
// JSON body parser
app.use(express.json());

// CORS - Tüm kaynaklardan gelen isteklere izin ver
app.use(cors());

// Request logger (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ==========================================================
// ROTA TANIMLARI
// ==========================================================

// Ana rota
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is running... 🚀',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// API rotaları
app.use('/master', masterRoutes);

// Auth rotaları
app.use('/api/auth/admin', adminRoutes);
app.use('/api/auth/user', userRoutes);
app.use('/api/auth/password-reset', passwordResetRoutes);
app.use('/api/sites', siteRoutes);
// Module rotaları
app.use('/api/company/invitations', invitationRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/complaints', requestRoutes);
app.use('/api/residence', residenceRoutes);
app.use('/api/sites', socialFacilitiesRoutes);

// ==========================================================
// HATA YÖNETİMİ
// ==========================================================

// 404 - Route bulunamadı
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route bulunamadı',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Sunucu hatası',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==========================================================
// SUNUCUYU BAŞLAT
// ==========================================================

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log(`💾 Database: ${prisma ? 'Connected' : 'Disconnected'}`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
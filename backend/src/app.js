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
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import announcementRoutes from './modules/announcement/announcement.routes.js';
import invitationRoutes from './modules/company/routes/invitation.routes.js';
import paymentRoutes from './modules/payment/routes/payment.routes.js';
import requestRoutes from './modules/request/request.routes.js';
import residenceRoutes from './modules/residence/residence.routes.js';
import socialFacilitiesRoutes from './modules/social-facilities/social-facilities.routes.js';

import masterAuthRoutes from './modules/master/auth/masterAuth.routes.js';
import masterDashboardRoutes from './modules/master/dashboard/dashboard.routes.js';
import masterCompanyRoutes from './modules/master/company/company.routes.js';
import individualRoutes from './modules/master/individual/individual.routes.js';
import { seedMasterAdmin } from './modules/master/auth/masterAuth.service.js';

// Yeni eklenen şikayet rotalarını import et
import adminComplaintRoutes from './modules/admin_complaint/routes/admin.complaint.routes.js';
import masterComplaintRoutes from './modules/admin_complaint/routes/master.complaint.routes.js';



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
console.log('Frontend public path:', frontendPublicPath);


// JSON body parser
app.use(express.json());

// CORS - Tüm kaynaklardan gelen isteklere izin ver
app.use(cors({
  origin: [
    'https://siteportal.com.tr',
    'https://www.siteportal.com.tr',
    'https://api.siteportal.com.tr'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // eğer cookie veya auth header kullanıyorsan
}));

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

app.use('/master', express.static(path.join(__dirname, 'frontend/public/master')));

// API rotaları
app.use('/api/auth/master', masterAuthRoutes);
app.use('/api/master', masterDashboardRoutes);
app.use('/api/master/company', masterCompanyRoutes);
app.use('/api/master/individuals', individualRoutes);
app.use('/api/admin/complaints', adminComplaintRoutes);

// Master şikayet rotaları
app.use('/api/master/complaints', masterComplaintRoutes);
// Auth rotaları
app.use('/api/auth/admin', adminRoutes);
app.use('/api/auth/user', userRoutes);
app.use('/api/auth/password-reset', passwordResetRoutes);
app.use('/api/sites', siteRoutes);
// Module rotaları
app.use('/api/company/invitations', invitationRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sites', announcementRoutes); // Announcements için /api/sites/:siteId/announcements
app.use('/api/payments', paymentRoutes);
app.use('/api/complaints', requestRoutes);
app.use('/api/residence', residenceRoutes);
app.use('/api/social-facilities', socialFacilitiesRoutes);



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
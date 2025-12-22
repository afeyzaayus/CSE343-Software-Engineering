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

// Complaint Routes
import adminComplaintRoutes from './modules/admin_complaint/routes/admin.complaint.routes.js';
import masterComplaintRoutes from './modules/admin_complaint/routes/master.complaint.routes.js';

dotenv.config();
const prisma = new PrismaClient();

// Seed master admin
(async () => {
  try {
    await seedMasterAdmin();
    console.log('✅ Master admin kontrolü tamamlandı');
  } catch (error) {
    console.error('⚠️  Master admin oluşturulamadı:', error.message);
  }
})();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON parser
app.use(express.json());

// CORS
app.use(cors({
  origin: [
    'https://www.siteportal.com.tr',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE']
}));

// Request logger (dev)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Static frontend path
app.use('/master', express.static(path.join(__dirname, '../../frontend/public/master')));

// ==========================================================
// Routes
// ==========================================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is running... 🚀',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(503).json({ success: false, status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// Master routes
app.use('/api/auth/master', masterAuthRoutes);
app.use('/api/master', masterDashboardRoutes);
app.use('/api/master/company', masterCompanyRoutes);
app.use('/api/master/individuals', individualRoutes);
app.use('/api/master/complaints', masterComplaintRoutes);

// Admin & Auth routes
app.use('/api/auth/admin', adminRoutes);
app.use('/api/auth/user', userRoutes);
app.use('/api/auth/password-reset', passwordResetRoutes);

// Site & module routes
app.use('/api/sites', siteRoutes);
app.use('/api/company/invitations', invitationRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sites/:siteId/announcements', announcementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/complaints', requestRoutes);
app.use('/api/residence', residenceRoutes);
app.use('/api/sites/:siteId/facilities', socialFacilitiesRoutes);

// Admin complaints
app.use('/api/admin/complaints', adminComplaintRoutes);

// ==========================================================
// Error handling
// ==========================================================
app.use((req, res) => res.status(404).json({ success: false, message: 'Route bulunamadı', path: req.path }));
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message, ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
});

// ==========================================================
// Start server
// ==========================================================
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log(`💾 Database: Connected`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });
process.on('unhandledRejection', (reason, promise) => console.error('Unhandled Rejection at:', promise, 'reason:', reason));

export default app;

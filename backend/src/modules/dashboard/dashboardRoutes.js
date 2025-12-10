import express from 'express';
import { 
  getDashboard, 
  getAdminInfo,
  getRecentAnnouncements 
} from './dashboardController.js';

const router = express.Router();

// Dashboard ana endpoint'i
router.get('/sites/:siteId/dashboard', getDashboard);

// Admin bilgisi
router.get('/sites/:siteId/admin-info', getAdminInfo);

// Son duyurular
router.get('/sites/:siteId/announcements/recent', getRecentAnnouncements);

export default router;

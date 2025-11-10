import express from 'express';
import { 
  getDashboard, 
  getRecentAnnouncements 
} from '../controllers/dashboardController.js';

const router = express.Router();

// Dashboard ana endpoint'i
router.get('/:siteId/dashboard', getDashboard);

// Son duyurular
router.get(':siteId/announcements/recent', getRecentAnnouncements);

export default router;
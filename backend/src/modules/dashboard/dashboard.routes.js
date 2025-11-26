import express from 'express';
import {
  getDashboardStatistics,
  getRecentAnnouncements
} from './dashboard.controller.js';
import { verifyAdminToken } from '../auth/middleware/adminAuth.middleware.js';

const router = express.Router();

// ==================== Dashboard ====================

/**
 * Tüm route'lar için authentication kontrolü
 */
router.use(verifyAdminToken);

/**
 * @route   GET /api/dashboard/statistics/:siteId
 * @desc    Dashboard istatistiklerini getir (site bilgisi, doluluk, aidat, duyurular, talepler)
 * @access  Private (SITE_MANAGER)
 */
router.get('/statistics/:siteId', getDashboardStatistics);

/**
 * @route   GET /api/dashboard/announcements/:siteId
 * @desc    Son duyuruları getir
 * @access  Private (SITE_MANAGER)
 * @query   { limit?: number } (default: 3, max: 20)
 */
router.get('/announcements/:siteId', getRecentAnnouncements);

export default router;
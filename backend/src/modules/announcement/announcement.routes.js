import express from 'express';
import {
  createAnnouncement,
  getAnnouncementsBySite,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} from './announcement.controller.js';
import { verifyAdminToken } from '../auth/middleware/adminAuth.middleware.js';

const router = express.Router();

// ==================== Duyuru Yönetimi ====================

/**
 * Tüm route'lar için authentication kontrolü
 */
router.use(verifyAdminToken);

/**
 * @route   GET /api/sites/:siteId/announcements
 * @desc    Belirli bir sitenin tüm duyurularını listele (aktif, geçmiş, hepsi)
 * @access  Private (SITE_MANAGER)
 */
router.get('/:siteId/announcements', getAnnouncementsBySite);

/**
 * @route   POST /api/sites/:siteId/announcements
 * @desc    Yeni duyuru oluştur
 * @access  Private (SITE_MANAGER)
 * @body    { title: string, content: string, start_date: date, end_date: date, priority: string }
 */
router.post('/:siteId/announcements', createAnnouncement);

/**
 * @route   GET /api/sites/:siteId/announcements/:id
 * @desc    Tek bir duyuruyu getir
 * @access  Private (SITE_MANAGER)
 */
router.get('/:siteId/announcements/:id', getAnnouncementById);

/**
 * @route   PUT /api/sites/:siteId/announcements/:id
 * @desc    Duyuru güncelle
 * @access  Private (SITE_MANAGER)
 * @body    { title?: string, content?: string, start_date?: date, end_date?: date, priority?: string }
 */
router.put('/:siteId/announcements/:id', updateAnnouncement);

/**
 * @route   DELETE /api/sites/:siteId/announcements/:id
 * @desc    Duyuru sil
 * @access  Private (SITE_MANAGER)
 */
router.delete('/:siteId/announcements/:id', deleteAnnouncement);

export default router;
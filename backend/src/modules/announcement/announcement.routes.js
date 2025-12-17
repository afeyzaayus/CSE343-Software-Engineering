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
 * @route   GET /api/sites/:siteId/announcements
 * @desc    Belirli bir sitenin tüm duyurularını listele (aktif, geçmiş, hepsi)
 * @access  Public - Tüm kullanıcılar (admin ve site sakinleri)
 */
router.get('/:siteId/announcements', getAnnouncementsBySite);

/**
 * @route   GET /api/sites/:siteId/announcements/:id
 * @desc    Tek bir duyuruyu getir
 * @access  Public - Tüm kullanıcılar (admin ve site sakinleri)
 */
router.get('/:siteId/announcements/:id', getAnnouncementById);

/**
 * Aşağıdaki route'lar için admin authentication kontrolü
 */
router.use(verifyAdminToken);

/**
 * @route   POST /api/sites/:siteId/announcements
 * @desc    Yeni duyuru oluştur
 * @access  Private (SITE_MANAGER)
 * @body    { title: string, content: string, start_date: date, end_date: date, priority: string }
 */
router.post('/:siteId/announcements', createAnnouncement);

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
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
 * @route   POST /api/announcements
 * @desc    Yeni duyuru oluştur
 * @access  Private (SITE_MANAGER)
 * @body    { title: string, content: string, start_date: date, end_date: date, site_id: string }
 */
router.post('/', createAnnouncement);

/**
 * @route   GET /api/announcements/site/:site_id
 * @desc    Belirli bir sitenin tüm duyurularını listele (aktif, geçmiş, hepsi)
 * @access  Private (SITE_MANAGER)
 */
router.get('/site/:site_id', getAnnouncementsBySite);

/**
 * @route   GET /api/announcements/:id/site/:site_id
 * @desc    Tek bir duyuruyu getir
 * @access  Private (SITE_MANAGER)
 */
router.get('/:id/site/:site_id', getAnnouncementById);

/**
 * @route   PUT /api/announcements/:id/site/:site_id
 * @desc    Duyuru güncelle
 * @access  Private (SITE_MANAGER)
 * @body    { title?: string, content?: string, start_date?: date, end_date?: date }
 */
router.put('/:id/site/:site_id', updateAnnouncement);

/**
 * @route   DELETE /api/announcements/:id/site/:site_id
 * @desc    Duyuru sil
 * @access  Private (SITE_MANAGER)
 */
router.delete('/:id/site/:site_id', deleteAnnouncement);

export default router;
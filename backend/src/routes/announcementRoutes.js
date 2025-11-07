import express from 'express';
import {
    createAnnouncement,
    getAnnouncementsBySite,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement
} from '../controllers/announcementController.js';
import { adminAuth } from '..//middleware/authMiddleware.js';

const router = express.Router();

// ===== DUYURU ROUTE'LARI =====

// POST /api/sites/{siteId}/announcements - Yeni duyuru ekleme (TEST: Token kaldırıldı)
router.post('/:siteId/announcements', createAnnouncement);

// GET /api/sites/{siteId}/announcements - Site'ye ait tüm duyuruları listeleme (Herkes)
router.get('/:siteId/announcements', getAnnouncementsBySite);

// GET /api/sites/{siteId}/announcements/{announcementId} - Belirli bir duyuruyu görüntüleme (Herkes)
router.get('/:siteId/announcements/:announcementId', getAnnouncementById);

// PUT /api/sites/{siteId}/announcements/{announcementId} - Duyuru güncelleme (TEST: Token kaldırıldı)
router.put('/:siteId/announcements/:announcementId', updateAnnouncement);

// DELETE /api/sites/{siteId}/announcements/{announcementId} - Duyuru silme (TEST: Token kaldırıldı)
router.delete('/:siteId/announcements/:announcementId', deleteAnnouncement);

export default router;

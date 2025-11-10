import express from 'express';
import {
    createRequest,
    getUserRequests,
    getSiteRequests,
    updateRequestStatus,
} from '../controllers/requestController.js';
import { userAuth, adminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Kullanıcı yeni talep/arıza oluşturur
router.post('/sites/:siteId/requests', userAuth, createRequest);

// Admin siteye ait tüm talepleri görür
router.get('/sites/:siteId/requests', adminAuth, getSiteRequests);

// Kullanıcı kendi taleplerini görür
router.get('/users/:userId/requests', userAuth, getUserRequests);

// Admin talep durumunu günceller
router.put('/sites/:siteId/requests/:requestId', adminAuth, updateRequestStatus);

export default router;

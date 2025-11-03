// backend/src/residents/residentRoutes.js

import express from 'express';
import { getAllResidentsBySite, updateResidentDetails } from './residentController.js';
import { protect, admin } from '../auth/authMiddleware.js'; // Kimlik doğrulama ve yetkilendirme

// mergeParams: true -> /api/sites/:siteId gibi üst rotalardaki parametreleri alabilmek için gereklidir.
const router = express.Router({ mergeParams: true });

// GET /api/sites/:siteId/residents -> Tüm sakinleri listeler (Sadece Admin)
router.route('/')
    .get(protect, admin, getAllResidentsBySite);

// PUT /api/sites/:siteId/residents/:userId -> Bir sakini günceller (Sadece Admin)
router.route('/:userId')
    .put(protect, admin, updateResidentDetails);

export default router;

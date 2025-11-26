// src/routes/complaintsRoutes.js

import express from 'express';
import complaintsController from '../controllers/complaintsController.js';

const router = express.Router();

/**
 * Complaints Routes
 * Base URL: /api/complaints
 */

// ============= Public/User Endpoints =============

/**
 * @route   GET /api/complaints
 * @desc    Tüm şikayetleri getir (filtreleme ile)
 * @access  Admin
 * @query   siteId (required) - Site ID
 * @query   status (optional) - pending, inprogress, resolved, cancelled, all
 * @query   category (optional) - maintenance, complaint, request, other, all
 * @query   userId (optional) - Belirli bir kullanıcının şikayetlerini getir
 */
router.get('/', complaintsController.getAllComplaints);

/**
 * @route   GET /api/complaints/user/:userId
 * @desc    Belirli bir kullanıcının kendi şikayetlerini getir
 * @access  User (kendi şikayetleri)
 * @params  userId - Kullanıcı ID
 * @query   siteId (required) - Site ID
 */
router.get('/user/:userId', complaintsController.getUserComplaints);

/**
 * @route   GET /api/complaints/stats/:siteId
 * @desc    Site için şikayet istatistikleri
 * @access  Admin
 * @params  siteId - Site ID
 */
router.get('/stats/:siteId', complaintsController.getComplaintStats);

/**
 * @route   GET /api/complaints/:id
 * @desc    Şikayet detayını getir
 * @access  Admin / User (kendi şikayeti)
 * @params  id - Şikayet ID
 */
router.get('/:id', complaintsController.getComplaintById);

/**
 * @route   POST /api/complaints
 * @desc    Yeni şikayet oluştur
 * @access  User
 * @body    {
 *            title: string (required),
 *            content: string (required),
 *            category: string (optional, default: MAINTENANCE),
 *            siteId: number (required),
 *            userId: number (required)
 *          }
 */
router.post('/', complaintsController.createComplaint);

// ============= Admin Endpoints =============

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Şikayet durumunu güncelle
 * @access  Admin
 * @params  id - Şikayet ID
 * @body    { status: string (PENDING | IN_PROGRESS | RESOLVED | CANCELLED) }
 */
router.patch('/:id/status', complaintsController.updateComplaintStatus);

/**
 * @route   DELETE /api/complaints/:id
 * @desc    Şikayeti sil
 * @access  Admin
 * @params  id - Şikayet ID
 */
router.delete('/:id', complaintsController.deleteComplaint);

export default router;
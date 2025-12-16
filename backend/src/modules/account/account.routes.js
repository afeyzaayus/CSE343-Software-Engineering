import express from 'express';
import {
  getAllAccounts,
  updateAccountStatus,
  getDashboardStats,
  getAccountById,
  updateAccountProfile
} from './account.controller.js';
import { verifyAdminToken } from '../auth/middleware/adminAuth.middleware.js';

const router = express.Router();

// ==================== Hesap Yönetimi ====================

/**
 * Tüm route'lar için authentication kontrolü
 * SUPER_ADMIN rolü kontrolü gerekiyorsa controller içinde yapılmalı
 */
router.use(verifyAdminToken);


/**
 * @route   GET /api/accounts/me
 * @desc    Giriş yapmış kullanıcının bilgilerini getir
 * @access  Private
 */
router.get('/me', (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.admin
  });
});

/**
 * @route   GET /api/accounts/dashboard/stats
 * @desc    Dashboard istatistiklerini getir
 * @access  Private (SUPER_ADMIN)
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * @route   GET /api/accounts
 * @desc    Tüm hesapları listele (filtreleme ile)
 * @access  Private (SUPER_ADMIN)
 * @query   { status?: string, type?: string, search?: string, deleted?: string }
 */
router.get('/', getAllAccounts);

/**
 * @route   GET /api/accounts/:id
 * @desc    Tek bir hesap detayını getir
 * @access  Private (SUPER_ADMIN)
 */
router.get('/:id', getAccountById);

/**
 * @route   PATCH /api/accounts/:id/status
 * @desc    Hesap durumunu güncelle (ACTIVE, SUSPENDED, DELETED)
 * @access  Private (SUPER_ADMIN)
 * @body    { status: string }
 */
router.patch('/:id/status', updateAccountStatus);

/**
 * @route   PUT /api/accounts/:id
 * @desc    Hesap profilini güncelle
 * @access  Private (SUPER_ADMIN)
 * @body    { full_name?: string, company_name?: string }
 */
router.put('/:id', updateAccountProfile);

export default router;
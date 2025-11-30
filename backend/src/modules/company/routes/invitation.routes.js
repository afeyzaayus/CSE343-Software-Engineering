import express from 'express';
import {
  createEmployeeInvitation,
  acceptEmployeeInvitation,
  getCompanyInvitations,
  deleteInvitation,
  verifyEmployeeInvitation
} from '../controller/invitation.controller.js';
import { verifyAdminToken, requireCompanyManager } from '../../auth/middleware/adminAuth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/company/invitations/create
 * @desc    Çalışan davetiyesi oluşturma
 * @access  Private (Company Manager only)
 * @body    { invited_email?: string } (opsiyonel - yoksa sadece kod oluşturulur)
 */
router.post(
  '/create',
  verifyAdminToken,
  requireCompanyManager,
  createEmployeeInvitation
);

/**
 * @route   POST /api/company/invitations/accept
 * @desc    Çalışan davetini kabul etme (Kayıt olma)
 * @access  Public
 * @body    { invite_code: string, full_name: string, email: string, password: string }
 */
router.post('/accept', acceptEmployeeInvitation);

/**
 * @route   GET /api/company/invitations
 * @desc    Şirket davetlerini listele
 * @access  Private (Company Manager only)
 */
router.get(
  '/',
  verifyAdminToken,
  requireCompanyManager,
  getCompanyInvitations
);


/**
 * @route   DELETE /api/company/invitations/:id
 * @desc    Daveti sil
 * @access  Private (Company Manager only)
 * ⚠️ DÜZELTİLDİ: '/invitations/:id' yerine '/:id' kullanıldı
 */
// DELETE /api/company/invitations/:id
router.delete('/:id', verifyAdminToken, requireCompanyManager, deleteInvitation);

/**
 * @route   POST /api/company/invitations/verify
 * @desc    Davet kodunu doğrula
 * @access  Public
 */
router.post('/verify', verifyEmployeeInvitation);

export default router;
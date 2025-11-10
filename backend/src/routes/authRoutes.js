import express from 'express';
import { 
  registerAdmin, 
  createSite, 
  registerUser,
  loginAdmin,
  loginUser,
  verifyEmail,
  verifyPhone,
  getSitesByAdmin,
  forgotAdminPassword,
  resetAdminPassword,
  setNewPassword,
  forgotUserPassword,
  resetUserPassword
} from '../controllers/authController.js';
import { adminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================================
// ADMIN ROTLARI
// ==========================================================
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);
router.get('/verify-email', verifyEmail);

/**
 * POST /api/auth/admin/forgot-password
 * Şifremi unuttum: Admin mailine sıfırlama linki gönderir.
 * Body: { email }
 */
router.post('/admin/forgot-password', forgotAdminPassword);
router.get('/admin/reset-password', resetAdminPassword);  // Token doğrulama (GET)
router.post('/admin/set-new-password', setNewPassword); 

// ==========================================================
// SİTE ROTLARI (Admin Yetkisi Gerektirir)
// ==========================================================

router.post('/site/create', adminAuth, createSite);
router.get('/site/admin-sites', adminAuth, getSitesByAdmin);

// ==========================================================
// KULLANICI (USER) ROTLARI
// ==========================================================

router.post('/user/verify-phone', verifyPhone);
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);

// authController.js
router.post('/user/forgot-password', forgotUserPassword);
router.post('/user/reset-password', resetUserPassword);

export default router;

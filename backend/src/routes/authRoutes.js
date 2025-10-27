import express from 'express';
import { 
  registerAdmin, 
  createSite, 
  registerUser,
  loginAdmin,
  loginUser,
  verifyEmail,
  verifyPhone,
  getSitesByAdmin
} from '../controllers/authController.js';
import { adminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================================
// ADMIN ROTLARI
// ==========================================================

/**
 * POST /api/auth/admin/register
 * Yeni bir Admin kaydı oluşturur ve doğrulama e-postası gönderir.
 */
router.post('/admin/register', registerAdmin);

/**
 * GET /api/auth/verify-email?token=xxx
 * E-posta doğrulama linki.
 */
router.get('/verify-email', verifyEmail);

/**
 * POST /api/auth/admin/login
 * Admin girişi (E-posta ve Şifre ile).
 * Body: { email, password }
 */
router.post('/admin/login', loginAdmin);

// ==========================================================
// SİTE ROTLARI (Admin Yetkisi Gerektirir)
// ==========================================================

/**
 * POST /api/auth/site/create
 * Oturum açmış bir Admin'in yeni bir site oluşturması.
 * Body: { site_id, site_name, site_address }
 * Headers: Authorization: Bearer <token>
 */
router.post('/site/create', adminAuth, createSite);

/**
 * GET /api/auth/site/admin-sites
 * Admin'e ait tüm siteleri listeler.
 * Headers: Authorization: Bearer <token>
 */
router.get('/site/admin-sites', adminAuth, getSitesByAdmin);

// ==========================================================
// KULLANICI (USER) ROTLARI
// ==========================================================
/**
 * POST /api/auth/user/verify-phone
 * Kullanıcının telefon numarasını doğrular (OTP).
 * Body: { phone_number, code }
 */
router.post('/user/verify-phone', verifyPhone);

/**
 * POST /api/auth/user/register
 * Yeni bir Kullanıcı kaydı oluşturur ve belirtilen siteye bağlar.
 * Body: { full_name, email, phone_number, password, site_id, block_no, apartment_no }
 */
router.post('/user/register', registerUser);

/**
 * POST /api/auth/user/login
 * Kullanıcı girişi (Telefon Numarası ve Şifre ile).
 * Body: { phone_number, password }
 */
router.post('/user/login', loginUser);

export default router;
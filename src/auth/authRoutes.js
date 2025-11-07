// routes/authRoutes.js

import express from 'express';
import { 
    registerAdmin, 
    createSite, 
    registerUser,
    loginAdmin,    // <-- YENİ EKLENDİ
    loginUser      // <-- YENİ EKLENDİ
} from './authController.js';
import { adminAuth } from './authMiddleware.js';
import { getSitesByAdmin } from './authController.js';
const router = express.Router();

// Not: Gerçek bir uygulamada, /site/create rotasından önce
// kullanıcının oturum açmış (logged in) ve yetkilendirilmiş (authorized)
// olduğunu kontrol eden bir 'authMiddleware' kullanılmalıdır.

// ==========================================================
// ADMIN ve SITE ROTLARI
// ==========================================================

/**
 * POST /api/auth/admin/register
 * Yeni bir Admin kaydı oluşturur.
 */
router.post('/admin/register', registerAdmin);

/**
 * POST /api/auth/admin/login
 * Admin girişi için rota. (E-posta ve Şifre ile)
 */
router.post('/admin/login', loginAdmin); // <-- YENİ LOGIN ROTASI

/**
 * POST /api/auth/site/create
 * Oturum açmış bir Admin'in yeni bir site oluşturması.
 * * NOT: Aşağıdaki satır, 'authMiddleware' kullanarak Admin ID'sini 
 * req.admin'e ekleyen bir güvenlik katmanı gerektirir. 
 * Şu an için basit bir deneme middleware'ı ile ADMIN ID'sini simüle ediyoruz.
 */
// router.post('/site/create', authMiddleware, createSite); 
router.post('/site/create', adminAuth, createSite);
// Backend (örnek Express kodu)
router.get('/site/admin-sites', adminAuth, getSitesByAdmin);

// ==========================================================
// KULLANICI (USER) ROTLARI
// ==========================================================

/**
 * POST /api/auth/user/register
 * Yeni bir Kullanıcı kaydı oluşturur ve belirtilen siteye bağlar.
 */
router.post('/user/register', registerUser);

/**
 * POST /api/auth/user/login
 * Kullanıcı girişi için rota. (Telefon Numarası ve Şifre ile)
 */
router.post('/user/login', loginUser); // <-- YENİ LOGIN ROTASI


export default router;
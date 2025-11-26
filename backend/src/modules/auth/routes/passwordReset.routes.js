import express from 'express';
import {
  forgotUserPassword,
  resetUserPassword,
  forgotAdminPassword,
  resetAdminPassword,
  setNewPassword
} from '../controller/passwordReset.controller.js';
import { verifyUserToken } from '../middleware/userAuth.middleware.js';
import { verifyAdminToken } from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// ==================== Mobil Kullanıcı Şifre Sıfırlama ====================

/**
 * @route   POST /api/auth/password-reset/user/forgot-password
 * @desc    Mobil kullanıcı şifre sıfırlama talebi (SMS kodu gönder)
 * @access  Public
 * @body    { phone_number: string, site_id: string }
 */
router.post('/user/forgot-password', forgotUserPassword);

/**
 * @route   POST /api/auth/password-reset/user/reset-password
 * @desc    Mobil kullanıcı şifre sıfırlama (SMS kodu ile)
 * @access  Public
 * @body    { phone_number: string, code: string, new_password: string, password_confirm: string }
 */
router.post('/user/reset-password', resetUserPassword);

// ==================== Admin Şifre Sıfırlama ====================

/**
 * @route   POST /api/auth/password-reset/admin/forgot-password
 * @desc    Admin şifre sıfırlama talebi (E-posta linki gönder)
 * @access  Public
 * @body    { email: string }
 */
router.post('/admin/forgot-password', forgotAdminPassword);

/**
 * @route   POST /api/auth/password-reset/admin/reset-password
 * @desc    Admin şifre sıfırlama (Token ile)
 * @access  Public
 * @body    { token: string, new_password: string, password_confirm: string }
 */
router.post('/admin/reset-password', resetAdminPassword);

// ==================== Giriş Yapmış Kullanıcı İçin Şifre Değiştirme ====================

/**
 * @route   POST /api/auth/password-reset/set-new-password
 * @desc    Giriş yapmış kullanıcı/admin için şifre değiştirme
 * @access  Private (User veya Admin token gerekli)
 * @body    { current_password: string, new_password: string, password_confirm: string }
 */
router.post(
  '/set-new-password',
  // Her iki middleware'i de dene, biri başarılı olursa devam et
  (req, res, next) => {
    verifyUserToken(req, res, (err) => {
      if (!err) return next();
      verifyAdminToken(req, res, next);
    });
  },
  setNewPassword
);

export default router;
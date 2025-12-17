import express from 'express';
import {
  forgotUserPassword,
  resetUserPassword,
  changeUserPassword,
  forgotAdminPassword,
  validateResetToken,
  setNewPassword,
  changePasswordWithLogin
} from '../controller/passwordReset.controller.js';

import { verifyUserToken } from '../middleware/userAuth.middleware.js';
import { verifyAdminToken } from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// =========================================================
// MOBİL KULLANICI – Şifre Sıfırlama
// =========================================================
router.post('/user/forgot-password', forgotUserPassword); // SMS ile kod gönder
router.post('/user/reset-password', resetUserPassword);    // Kod ile şifre sıfırlama
router.post('/user/change-password', verifyUserToken, changeUserPassword); // login ile değişim

// =========================================================
// ADMİN – Şifre Sıfırlama
// =========================================================
router.post('/admin/forgot-password', forgotAdminPassword);   // Email link gönder
router.get('/admin/verify-token/:token', validateResetToken); // Token doğrulama
router.post('/admin/set-new-password', setNewPassword);        // Token ile yeni şifre

// =========================================================
// LOGIN OLMUŞ KULLANICI/ADMİN – Şifre Değiştirme
// =========================================================
router.post(
  '/change-password',
  (req, res, next) => {
    verifyUserToken(req, res, (err) => {
      if (!err) return next(); // User token geçerli
      verifyAdminToken(req, res, (err2) => {
        if (!err2) return next(); // Admin token geçerli
        return res.status(401).json({ success: false, message: 'Yetkisiz işlem.' });
      });
    });
  },
  changePasswordWithLogin
);

export default router;

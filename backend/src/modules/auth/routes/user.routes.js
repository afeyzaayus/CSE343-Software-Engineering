import express from 'express';
import {
  initiatePasswordSetup,
  setPasswordWithCode,
  loginUser
} from '../controller/userAuth.controller.js';

const router = express.Router();

/**
 * @route   POST /api/auth/user/initiate-password-setup
 * @desc    Şifre belirleme sürecini başlat (Kullanıcı doğrulama, OTP gönderimi frontendde)
 * @access  Public
 * @body    { phone_number: string, site_id: string }
 */
router.post('/initiate-password-setup', initiatePasswordSetup);

/**
 * @route   POST /api/auth/user/set-password
 * @desc    SMS kodu ile şifre belirleme (OTP doğrulaması frontendde)
 * @access  Public
 * @body    { phone_number: string, code: string, password: string, password_confirm: string }
 */
router.post('/set-password', setPasswordWithCode);

/**
 * @route   POST /api/auth/user/login
 * @desc    Mobil kullanıcı girişi
 * @access  Public
 * @body    { phone_number: string, password: string }
 */
router.post('/login', loginUser);

export default router;
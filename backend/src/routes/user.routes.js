import express from 'express';
import {
  initiatePasswordSetup,
  setPasswordWithCode,
  loginUser
} from '../controllers/auth/userAuth.controller.js';

const router = express.Router();

/**
 * @route   POST /api/auth/user/initiate-password-setup
 * @desc    Şifre belirleme sürecini başlat (SMS kodu gönder)
 * @access  Public
 * @body    { phone_number: string, site_id: string }
 */
router.post('/initiate-password-setup', initiatePasswordSetup);

/**
 * @route   POST /api/auth/user/set-password
 * @desc    SMS kodu ile şifre belirleme
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
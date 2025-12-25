import express from 'express';
import {
  registerIndividual,
  registerCompanyManager,
  verifyEmail,
  loginAdmin,
  changePassword
} from '../controller/adminAuth.controller.js';
import { verifyAdminToken } from '../middleware/adminAuth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/admin/register/individual
 * @desc    Bireysel admin kaydı
 * @access  Public
 */
router.post('/register/individual', registerIndividual);

/**
 * @route   POST /api/auth/admin/register/company-manager
 * @desc    Şirket yöneticisi kaydı
 * @access  Public
 */
router.post('/register/company-manager', registerCompanyManager);

/**
 * @route   GET /api/auth/admin/verify-email?token=xxx
 * @desc    E-posta doğrulama
 * @access  Public
 */
router.get('/verify-email', verifyEmail);



/**
 * @route   POST /api/auth/admin/login
 * @desc    Admin girişi (bireysel veya şirket yöneticisi)
 * @access  Public
 */
router.post('/login', loginAdmin);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Şifre değiştirme (JWT gerekli)
 * @access  Private
 */
router.put('/change-password', verifyAdminToken, changePassword);

export default router;
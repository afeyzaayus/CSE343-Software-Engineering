import express from 'express';
import { userRegister, adminRegister } from '../controllers/authController.js';
import { body } from 'express-validator';

const router = express.Router();

// Kullanıcı kayıt rotası (Input Validation dahil)
router.post(
  '/user/register',
  [
    body('full_name').notEmpty().withMessage('Ad Soyad zorunludur.'),
    body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin.'),
    body('phone_number').notEmpty().withMessage('Telefon numarası zorunludur.'),
    body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır.'),
    body('site_id').notEmpty().withMessage('Site ID zorunludur.'),
  ],
  userRegister
);

// Yönetici kayıt rotası (Input Validation dahil)
router.post(
  '/admin/register',
  [
    body('full_name').notEmpty().withMessage('Ad Soyad zorunludur.'),
    body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin.'),
    body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır.'),
    body('site_id').notEmpty().withMessage('Site ID zorunludur.'),
    body('account_type').notEmpty().withMessage('Hesap tipi zorunludur.'),
  ],
  adminRegister
);

export default router;
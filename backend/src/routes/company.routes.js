import express from 'express';
import {
  getCompanyByManager,
  updateCompany,
  getCompanyEmployees
} from '../controllers/company/company.controller.js';
import { verifyAdminToken } from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// ==================== Şirket Yönetimi ====================

/**
 * Tüm route'lar için authentication kontrolü
 * COMPANY_MANAGER rolü kontrolü controller içinde yapılıyor
 */
router.use(verifyAdminToken);

/**
 * @route   GET /api/company
 * @desc    Şirket yöneticisinin şirket bilgilerini getir (siteler ve çalışanlar dahil)
 * @access  Private (COMPANY_MANAGER)
 */
router.get('/', getCompanyByManager);

/**
 * @route   PUT /api/company
 * @desc    Şirket bilgilerini güncelle
 * @access  Private (COMPANY_MANAGER)
 * @body    { company_name?: string, company_address?: string }
 */
router.put('/', updateCompany);

/**
 * @route   GET /api/company/employees
 * @desc    Şirket çalışanlarını listele (atanmış siteler dahil)
 * @access  Private (COMPANY_MANAGER)
 */
router.get('/employees', getCompanyEmployees);

export default router;
import express from 'express';
import {
  getCompanyByManager,
  updateCompany,
  getCompanyEmployees,
  suspendEmployee,      // ✅ Eklendi
  activateEmployee,     // ✅ Eklendi
  deleteEmployee        // ✅ Eklendi
} from '../controller/company.controller.js';
import { verifyAdminToken, requireCompanyManager } from '../../auth/middleware/adminAuth.middleware.js';

const router = express.Router();

// ==================== Şirket Yönetimi ====================

/**
 * Tüm route'lar için authentication kontrolü
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

// ==================== Çalışan Yönetimi ====================

router.get('/employees', (req, res, next) => {
  console.log('🎯 ROUTE ÇALIŞTI: GET /api/company/employees');
  console.log('👤 req.admin:', req.admin);
  next();
}, requireCompanyManager, getCompanyEmployees);


/**
 * @route   PUT /api/company/employees/:id/suspend
 * @desc    Çalışanı askıya al
 * @access  Private (COMPANY_MANAGER)
 */
router.put('/employees/:id/suspend', requireCompanyManager, suspendEmployee);

/**
 * @route   PUT /api/company/employees/:id/activate
 * @desc    Çalışanı aktif et
 * @access  Private (COMPANY_MANAGER)
 */
router.put('/employees/:id/activate', requireCompanyManager, activateEmployee);

/**
 * @route   DELETE /api/company/employees/:id
 * @desc    Çalışanı sil (soft delete)
 * @access  Private (COMPANY_MANAGER)
 */
router.delete('/employees/:id', requireCompanyManager, deleteEmployee);

export default router;
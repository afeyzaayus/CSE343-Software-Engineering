import express from 'express';
import {
  createSite,
  updateSite,
  getSites,
  getSiteById,
  deleteSite
} from './site.controller.js';
import { verifyAdminToken } from '../auth/middleware/adminAuth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/sites
 * @desc    Site listesi getir (Admin tipine göre filtreleme)
 * @access  Private (Admin only)
 * @query   { status?: string, search?: string }
 * 
 * INDIVIDUAL → Sadece kendi oluşturduğu siteler
 * COMPANY_MANAGER → Şirketinin tüm siteleri
 * COMPANY_EMPLOYEE → Şirketin tüm siteleri (sadece görüntüleme)
 * SUPER_ADMIN → Tüm siteler
 */
router.get('/', verifyAdminToken, getSites);

/**
 * @route   POST /api/sites
 * @desc    Site oluşturma
 * @access  Private (Admin only - COMPANY_EMPLOYEE hariç)
 * @body    { site_id: string, site_name: string, site_address: string }
 */
router.post('/', verifyAdminToken, createSite);

/**
 * @route   GET /api/sites/:siteId
 * @desc    Tek bir site detayı getir (bloklar, kullanıcılar dahil)
 * @access  Private (Admin only - Yetkisi olan admin)
 */
router.get('/:siteId', verifyAdminToken, getSiteById);

/**
 * @route   PUT /api/sites/:siteId
 * @desc    Site güncelleme
 * @access  Private (Admin only - COMPANY_EMPLOYEE düzenleyemez)
 * @body    { site_name?: string, site_address?: string }
 */
router.put('/:siteId', verifyAdminToken, updateSite);

/**
 * @route   DELETE /api/sites/:siteId
 * @desc    Site silme (soft delete)
 * @access  Private (Admin only - COMPANY_EMPLOYEE silemez)
 */
router.delete('/:siteId', verifyAdminToken, deleteSite);

export default router;
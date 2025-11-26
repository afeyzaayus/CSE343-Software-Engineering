import express from 'express';
import {
  createSite,
  updateSite,
  getSites,
  getSiteById,
  deleteSite
} from '../controller/site.controller.js';
import { verifyAdminToken } from '../../auth/middleware/adminAuth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/sites/create
 * @desc    Site oluşturma (bloklar otomatik oluşturulur)
 * @access  Private (Admin only)
 * @body    { site_id: string, site_name: string, site_address: string, block_count?: number, apartment_count?: number }
 */
router.post('/create', verifyAdminToken, createSite);

/**
 * @route   PUT /api/sites/:siteId
 * @desc    Site güncelleme (block_count değişirse bloklar yeniden oluşturulur)
 * @access  Private (Admin only - Site sahibi veya SUPER_ADMIN)
 * @body    { site_name?: string, site_address?: string, block_count?: number, apartment_count?: number }
 */
router.put('/:siteId', verifyAdminToken, updateSite);

/**
 * @route   GET /api/sites
 * @desc    Site listesi getir (Admin tipine göre filtreleme)
 * @access  Private (Admin only)
 * @query   { status?: string, search?: string }
 * 
 * INDIVIDUAL → Sadece kendi oluşturduğu siteler
 * COMPANY_MANAGER → Şirketinin tüm siteleri
 * COMPANY_EMPLOYEE → Atandığı siteler
 * SUPER_ADMIN → Tüm siteler
 */
router.get('/', verifyAdminToken, getSites);

/**
 * @route   GET /api/sites/:siteId
 * @desc    Tek bir site detayı getir (bloklar, kullanıcılar dahil)
 * @access  Private (Admin only - Yetkisi olan admin)
 */
router.get('/:siteId', verifyAdminToken, getSiteById);

/**
 * @route   DELETE /api/sites/:siteId
 * @desc    Site silme (soft delete)
 * @access  Private (Admin only - Site sahibi veya SUPER_ADMIN)
 */
router.delete('/:siteId', verifyAdminToken, deleteSite);

export default router;
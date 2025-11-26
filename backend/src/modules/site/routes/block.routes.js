import express from 'express';
import {
  getBlocksBySite,
  updateBlock,
  deleteBlock,
  recreateBlocks
} from '../controller/block.controller.js';
import { verifyAdminToken } from '../../auth/middleware/adminAuth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/sites/:siteId/blocks
 * @desc    Site'ın tüm bloklarını getir
 * @access  Private (Admin only)
 */
router.get('/sites/:siteId/blocks', verifyAdminToken, getBlocksBySite);

/**
 * @route   PUT /api/blocks/:blockId
 * @desc    Blok güncelleme (isim değiştirme)
 * @access  Private (Admin only)
 * @body    { block_name: string }
 */
router.put('/blocks/:blockId', verifyAdminToken, updateBlock);

/**
 * @route   DELETE /api/blocks/:blockId
 * @desc    Blok silme (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/blocks/:blockId', verifyAdminToken, deleteBlock);

/**
 * @route   POST /api/sites/:siteId/blocks/recreate
 * @desc    Site bloklarını yeniden oluştur (eskiler silinir, yeniler oluşturulur)
 * @access  Private (Admin only)
 * @body    { block_count: number }
 */
router.post('/sites/:siteId/blocks/recreate', verifyAdminToken, recreateBlocks);

export default router;
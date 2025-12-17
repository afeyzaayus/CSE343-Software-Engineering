import express from 'express';
import { 
    fetchDashboardMetrics, 
    extendSubscription,
    fetchAccountPrices, 
    updateAccountPriceController 
} from './dashboard.controller.js';

const router = express.Router();

/**
 * @route   GET /api/master/dashboard/stats
 * @desc    Master dashboard metrikleri
 * @access  Master Admin
 */
router.get('/dashboard/stats', fetchDashboardMetrics);

/**
 * @route   POST /api/master/accounts/:accountId/extend-subscription
 * @desc    Hesap aboneliğini uzat
 * @access  Master Admin
 * @body    { months: number } (opsiyonel, default: 12)
 */
router.post('/accounts/:accountId/extend-subscription', extendSubscription);

/**
 * @route   GET /api/master/prices
 * @desc    Hesap fiyatlarını getir
 * @access  Master Admin
 */
router.get('/prices', fetchAccountPrices);

/**
 * @route   POST /api/master/prices
 * @desc    Hesap fiyatlarını güncelle
 * @access  Master Admin
 */
router.post('/prices/update', updateAccountPriceController);

export default router;
import express from 'express';
import { 
    fetchDashboardMetrics, 
    extendSubscription
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

export default router;
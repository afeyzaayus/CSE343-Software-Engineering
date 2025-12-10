import express from 'express';
import {
  createPayment,
  getPaymentsBySite,
  getPaymentById,
  getUserPayments,
  getPaymentStats,
  getResidentsBySite
} from '../controllers/payment.controller.js';

const router = express.Router();

// ===== ÖDEME OLUŞTURMA =====
// POST /api/payments
// Body: { userId, siteId, amount, payment_date, payment_method, description }
router.post('/', createPayment);

// ===== SİTE'YE AİT TÜM ÖDEMELERİ GETIRME =====
// GET /api/payments/site/:siteId
// Query params: startDate, endDate, userId, payment_method
router.get('/site/:siteId', getPaymentsBySite);

// ===== SİTE SAKİNLERİNİ GETIRME =====
// GET /api/payments/site/:siteId/residents
router.get('/site/:siteId/residents', getResidentsBySite);

// ===== SİTE'YE AİT ÖDEME İSTATİSTİKLERİ =====
// GET /api/payments/site/:siteId/stats
// Query params: startDate, endDate
router.get('/site/:siteId/stats', getPaymentStats);

// ===== KULLANICININ TÜM ÖDEMELERİ =====
// GET /api/payments/user/:userId
router.get('/user/:userId', getUserPayments);

// ===== TEK BİR ÖDEME DETAYI =====
// GET /api/payments/:paymentId
router.get('/:paymentId', getPaymentById);

export default router;

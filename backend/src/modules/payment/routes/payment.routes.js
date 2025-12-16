import express from 'express';
import {
  createPayment,
  getPaymentsBySite,
  getPaymentById,
  getUserPayments,
  getPaymentStats,
  getResidentsBySite,
  getMonthlyDuesBySite,
  createMonthlyDuesForAllResidents,
  recordMonthlyPayment,
  getOverdueStats
} from '../controllers/payment.controller.js';

const router = express.Router();

// ===== ÖDEME OLUŞTURMA =====
// POST /api/payments
// Body: { userId, siteId, amount, payment_date, payment_method, description }
router.post('/', createPayment);

// ===== AYLIK AIDATLARI OLUŞTURMA (Tüm sakinler için) =====
// POST /api/payments/monthly/create-all
// Body: { siteId, month, year, amount, due_date }
router.post('/monthly/create-all', createMonthlyDuesForAllResidents);

// ===== AYLIK ÖDEME KAYDETME (Manuel ödeme) =====
// POST /api/payments/monthly/record-payment
// Body: { monthlyDueId, payment_method }
router.post('/monthly/record-payment', recordMonthlyPayment);

// ===== SİTE'YE AİT TÜM ÖDEMELERİ GETIRME =====
// GET /api/payments/site/:siteId
// Query params: startDate, endDate, userId, payment_method
router.get('/site/:siteId', getPaymentsBySite);

// ===== AYLIK AIDATLARI GETIRME (Ay ve yıla göre) =====
// GET /api/payments/site/:siteId/monthly?month=12&year=2025
router.get('/site/:siteId/monthly', getMonthlyDuesBySite);

// ===== OVERDUE İSTATİSTİKLERİ =====
// GET /api/payments/site/:siteId/overdue-stats
router.get('/site/:siteId/overdue-stats', getOverdueStats);

// ===== SİTE'YE AİT ÖDEME İSTATİSTİKLERİ =====
// GET /api/payments/site/:siteId/stats
// Query params: startDate, endDate
router.get('/site/:siteId/stats', getPaymentStats);

// ===== SİTE SAKİNLERİNİ GETIRME =====
// GET /api/payments/site/:siteId/residents
router.get('/site/:siteId/residents', getResidentsBySite);

// ===== KULLANICININ TÜM ÖDEMELERİ =====
// GET /api/payments/user/:userId
router.get('/user/:userId', getUserPayments);

// ===== TEK BİR ÖDEME DETAYI =====
// GET /api/payments/:paymentId
router.get('/:paymentId', getPaymentById);

export default router;

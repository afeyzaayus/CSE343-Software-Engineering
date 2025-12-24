import express from 'express';
import {
  getResidentsBySite,
  getMonthlyDuesBySite,
  createMonthlyDuesForAllResidents,
  recordMonthlyPayment,
  getOverdueStats
} from '../controllers/payment.controller.js';

const router = express.Router();

// ===== AYLIK AIDATLARI OLUŞTURMA (Tüm sakinler için) =====
// POST /api/payments/monthly/create-all
// Body: { siteId, month, year, amount, due_date }
router.post('/monthly/create-all', createMonthlyDuesForAllResidents);

// ===== AYLIK ÖDEME KAYDETME (Manuel ödeme) =====
// POST /api/payments/monthly/record-payment
// Body: { monthlyDueId, payment_method }
router.post('/monthly/record-payment', recordMonthlyPayment);

// ===== AYLIK AIDATLARI GETIRME (Ay ve yıla göre) =====
// GET /api/payments/site/:siteId/monthly?month=12&year=2025
router.get('/site/:siteId/monthly', getMonthlyDuesBySite);

// ===== OVERDUE İSTATİSTİKLERİ =====
// GET /api/payments/site/:siteId/overdue-stats
router.get('/site/:siteId/overdue-stats', getOverdueStats);

// ===== SİTE SAKİNLERİNİ GETIRME =====
// GET /api/payments/site/:siteId/residents
router.get('/site/:siteId/residents', getResidentsBySite);



export default router;
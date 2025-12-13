import express from 'express';
import {
    getAllCompaniesHandler,
    getCompanyByIdHandler,
    getCompanyByCodeHandler,
    updateCompanyStatusHandler,
    softDeleteCompanyHandler,
    restoreCompanyHandler,
    hardDeleteCompanyHandler,
    getCompanyStatsHandler,
    getCompanyAdminsHandler,
    updateAdminRoleHandler,
    updateAdminStatusHandler,
    softDeleteAdminHandler,
    restoreAdminHandler,
    hardDeleteAdminHandler,
    getCompanySitesHandler,
    updateSiteStatusHandler,
    softDeleteSiteHandler,
    restoreSiteHandler,
    hardDeleteSiteHandler,
    updateCompanyHandler
} from './company.controller.js';

const router = express.Router();

// ===========================
// ŞİRKET YÖNETİMİ
// ===========================
// Base: /api/master/company

// Tüm şirketleri listele (query params: ?includeDeleted=true&status=ACTIVE)
// GET /api/master/company/
router.get('/', getAllCompaniesHandler);

// Şirket istatistikleri
// GET /api/master/company/stats/counts
router.get('/stats/counts', getCompanyStatsHandler);

// Şirket koduna göre şirket getir
// GET /api/master/company/code/:code
router.get('/code/:code', getCompanyByCodeHandler);

// ID'ye göre şirket detayı
// GET /api/master/company/:id
router.get('/:id', getCompanyByIdHandler);

router.patch('/:id', updateCompanyHandler);

// Şirket durumunu güncelle (ACTIVE / SUSPENDED)
// PATCH /api/master/company/:id/status
router.patch('/:id/status', updateCompanyStatusHandler);

// Şirketi soft delete yap
// DELETE /api/master/company/:id/soft
router.delete('/:id/soft', softDeleteCompanyHandler);

// Soft delete edilmiş şirketi geri yükle
// PATCH /api/master/company/:id/restore
router.patch('/:id/restore', restoreCompanyHandler);

// Şirketi kalıcı olarak sil (hard delete)
// DELETE /api/master/company/:id/hard
router.delete('/:id/hard', hardDeleteCompanyHandler);

// ===========================
// ŞİRKET ÇALIŞANLARI (ADMINS)
// ===========================

// Şirkete bağlı adminleri listele (query params: ?includeDeleted=true&status=ACTIVE)
// GET /api/master/company/:id/admins
router.get('/:id/admins', getCompanyAdminsHandler);

// Admin rolünü değiştir
// PATCH /api/master/company/admins/:id/role
router.patch('/admins/:id/role', updateAdminRoleHandler);

// Admin durumunu değiştir (ACTIVE / SUSPENDED)
// PATCH /api/master/company/admins/:id/status
router.patch('/admins/:id/status', updateAdminStatusHandler);

// Admin'i soft delete yap
// DELETE /api/master/company/admins/:id/soft
router.delete('/admins/:id/soft', softDeleteAdminHandler);

// Soft delete edilmiş admin'i geri yükle
// PATCH /api/master/company/admins/:id/restore
router.patch('/admins/:id/restore', restoreAdminHandler);

// Admin'i kalıcı olarak sil (hard delete)
// DELETE /api/master/company/admins/:id/hard
router.delete('/admins/:id/hard', hardDeleteAdminHandler);

// ===========================
// ŞİRKET SİTELERİ
// ===========================

// Şirkete bağlı siteleri listele (query params: ?includeDeleted=true&status=ACTIVE)
// GET /api/master/company/:id/sites
router.get('/:id/sites', getCompanySitesHandler);

// Site durumunu değiştir (ACTIVE / SUSPENDED)
// PATCH /api/master/company/sites/:id/status
router.patch('/sites/:id/status', updateSiteStatusHandler);

// Site'yi soft delete yap
// DELETE /api/master/company/sites/:id/soft
router.delete('/sites/:id/soft', softDeleteSiteHandler);

// Soft delete edilmiş site'yi geri yükle
// PATCH /api/master/company/sites/:id/restore
router.patch('/sites/:id/restore', restoreSiteHandler);

// Site'yi kalıcı olarak sil (hard delete)
// DELETE /api/master/company/sites/:id/hard
router.delete('/sites/:id/hard', hardDeleteSiteHandler);

export default router;

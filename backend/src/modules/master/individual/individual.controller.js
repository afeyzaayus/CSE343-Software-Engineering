import {
    getAllIndividuals,
    getIndividualById,
    updateIndividualStatus,
    softDeleteIndividual,
    restoreIndividual,
    hardDeleteIndividual,
    getIndividualStatistics,
    getSitesByIndividualId,
    updateSiteStatus,
    softDeleteSite,
    restoreSite,
    hardDeleteSite
} from './individual.service.js';

/**
 * Tüm bireysel hesapları listele
 * GET /api/master/individuals?includeDeleted=true&status=ACTIVE
 */
export async function getAllIndividualsHandler(req, res) {
    try {
        const { includeDeleted, status } = req.query;
        
        const filters = {
            includeDeleted: includeDeleted === 'true',
            status: status || null
        };

        const individuals = await getAllIndividuals(filters);

        return res.status(200).json({
            success: true,
            count: individuals.length,
            data: individuals
        });
    } catch (error) {
        console.error('❌ Bireysel hesapları getirme hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Bireysel hesaplar getirilemedi',
            error: error.message
        });
    }
}

/**
 * Bireysel hesap detayını getir
 * GET /api/master/individuals/:id
 */
export async function getIndividualByIdHandler(req, res) {
    try {
        const { id } = req.params;

        const individual = await getIndividualById(id);

        if (!individual) {
            return res.status(404).json({
                success: false,
                message: 'Bireysel hesap bulunamadı'
            });
        }

        return res.status(200).json({
            success: true,
            data: individual
        });
    } catch (error) {
        console.error('❌ Bireysel hesap getirme hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Bireysel hesap getirilemedi',
            error: error.message
        });
    }
}

/**
 * Bireysel hesap durumunu güncelle
 * PATCH /api/master/individuals/:id/status
 */
export async function updateIndividualStatusHandler(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz durum. ACTIVE veya SUSPENDED olmalıdır.'
            });
        }

        const updatedIndividual = await updateIndividualStatus(id, status);

        return res.status(200).json({
            success: true,
            message: `${updatedIndividual.full_name} hesabının durumu ${status} olarak güncellendi`,
            data: updatedIndividual
        });
    } catch (error) {
        console.error('❌ Bireysel hesap durum güncelleme hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Bireysel hesap durumu güncellenemedi',
            error: error.message
        });
    }
}

/**
 * Bireysel hesabı soft delete yap
 * DELETE /api/master/individuals/:id/soft
 */
export async function softDeleteIndividualHandler(req, res) {
    try {
        const { id } = req.params;

        const deletedIndividual = await softDeleteIndividual(id);

        return res.status(200).json({
            success: true,
            message: `${deletedIndividual.full_name} hesabı başarıyla silindi`,
            data: deletedIndividual
        });
    } catch (error) {
        console.error('❌ Bireysel hesap silme hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Bireysel hesap silinemedi',
            error: error.message
        });
    }
}

/**
 * Soft delete edilmiş hesabı geri yükle
 * PATCH /api/master/individuals/:id/restore
 */
export async function restoreIndividualHandler(req, res) {
    try {
        const { id } = req.params;

        const restoredIndividual = await restoreIndividual(id);

        return res.status(200).json({
            success: true,
            message: `${restoredIndividual.full_name} hesabı başarıyla geri yüklendi`,
            data: restoredIndividual
        });
    } catch (error) {
        console.error('❌ Bireysel hesap geri yükleme hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Bireysel hesap geri yüklenemedi',
            error: error.message
        });
    }
}

/**
 * Hesabı kalıcı olarak sil
 * DELETE /api/master/individuals/:id/hard
 */
export async function hardDeleteIndividualHandler(req, res) {
    try {
        const { id } = req.params;

        await hardDeleteIndividual(id);

        return res.status(200).json({
            success: true,
            message: 'Bireysel hesap kalıcı olarak silindi'
        });
    } catch (error) {
        console.error('❌ Bireysel hesap kalıcı silme hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Bireysel hesap kalıcı olarak silinemedi',
            error: error.message
        });
    }
}

/**
 * Bireysel hesaplar istatistiklerini getir
 * GET /api/master/individuals/statistics
 */
export async function getIndividualStatisticsHandler(req, res) {
    try {
        const stats = await getIndividualStatistics();

        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ Bireysel hesap istatistikleri hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'İstatistikler getirilemedi',
            error: error.message
        });
    }
}

/**
 * Bireysel hesaba ait site'yi getir
 * GET /api/master/individuals/:id/site
 */
export async function getSitesByIndividualIdHandler(req, res) {
    try {
        const { id } = req.params;

        const sites = await getSitesByIndividualId(id);

        if (!sites || sites.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bu bireysel hesaba bağlı site bulunamadı'
            });
        }

        return res.status(200).json({
            success: true,
            data: sites
        });
    } catch (error) {
        console.error('❌ Site getirme hatası:', error);
        
        if (error.message === 'Bireysel hesap bulunamadı') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Site getirilemedi',
            error: error.message
        });
    }
}

/**
 * Site durumunu güncelle
 * PATCH /api/master/individuals/sites/:siteId/status
 */
export async function updateSiteStatusHandler(req, res) {
    try {
        const { siteId } = req.params;
        const { status } = req.body;

        if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz durum. ACTIVE veya SUSPENDED olmalıdır.'
            });
        }

        const updatedSite = await updateSiteStatus(siteId, status);

        return res.status(200).json({
            success: true,
            message: `${updatedSite.site_name} sitesinin durumu ${status} olarak güncellendi`,
            data: updatedSite
        });
    } catch (error) {
        console.error('❌ Site durum güncelleme hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Site durumu güncellenemedi',
            error: error.message
        });
    }
}

/**
 * Site'yi soft delete yap
 * DELETE /api/master/individuals/sites/:siteId/soft
 */
export async function softDeleteSiteHandler(req, res) {
    try {
        const { siteId } = req.params;

        const deletedSite = await softDeleteSite(siteId);

        return res.status(200).json({
            success: true,
            message: `${deletedSite.site_name} sitesi başarıyla silindi`,
            data: deletedSite
        });
    } catch (error) {
        console.error('❌ Site silme hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Site silinemedi',
            error: error.message
        });
    }
}

/**
 * Silinmiş site'yi geri yükle
 * PATCH /api/master/individuals/sites/:siteId/restore
 */
export async function restoreSiteHandler(req, res) {
    try {
        const { siteId } = req.params;

        const restoredSite = await restoreSite(siteId);

        return res.status(200).json({
            success: true,
            message: `${restoredSite.site_name} sitesi başarıyla geri yüklendi`,
            data: restoredSite
        });
    } catch (error) {
        console.error('❌ Site geri yükleme hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Site geri yüklenemedi',
            error: error.message
        });
    }
}

/**
 * Site'yi kalıcı olarak sil
 * DELETE /api/master/individuals/sites/:siteId/hard
 */
export async function hardDeleteSiteHandler(req, res) {
    try {
        const { siteId } = req.params;

        await hardDeleteSite(siteId);

        return res.status(200).json({
            success: true,
            message: 'Site kalıcı olarak silindi'
        });
    } catch (error) {
        console.error('❌ Site kalıcı silme hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Site kalıcı olarak silinemedi',
            error: error.message
        });
    }
}
import {
    getAllCompanies,
    getCompanyById,
    getCompanyByCode,
    updateCompanyStatus,
    softDeleteCompany,
    restoreCompany,
    hardDeleteCompany,
    getActiveCompanyCounts,
    getSuspendedCompanyCounts,
    getDeletedCompanyCounts,
    getTotalCompanyCounts,
    updateAdminRole,
    restoreAdmin,
    hardDeleteAdmin,
    getCompanySites,
    restoreSite,
    hardDeleteSite,
    updateCompanyById,
    getCompanyEmployees // EKLENDİ
} from './company.service.js';

// ===========================
// ŞİRKET YÖNETİMİ
// ===========================

/**
 * GET /api/master/companies
 * Tüm şirketleri listele (filter ile)
 */
export async function getAllCompaniesHandler(req, res) {
    try {
        const filters = {
            includeDeleted: req.query.includeDeleted === 'true',
            status: req.query.status || null,
        };

        const companies = await getAllCompanies(filters);

        res.json({
            success: true,
            message: 'Şirketler başarıyla getirildi.',
            data: companies,
        });
    } catch (error) {
        console.error('Get all companies error:', error);
        res.status(500).json({
            success: false,
            message: 'Şirketler getirilirken bir hata oluştu.',
            error: error.message,
        });
    }
}

/**
 * GET /api/master/companies/:id
 * ID'ye göre şirket detayı
 */
export async function getCompanyByIdHandler(req, res) {
    try {
        const companyId = parseInt(req.params.id);

        if (isNaN(companyId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz şirket ID.',
            });
        }

        const company = await getCompanyById(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Şirket bulunamadı.',
            });
        }

        res.json({
            success: true,
            message: 'Şirket başarıyla getirildi.',
            data: company,
        });
    } catch (error) {
        console.error('Get company by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Şirket getirilirken bir hata oluştu.',
            error: error.message,
        });
    }
}

/**
 * GET /api/master/companies/code/:code
 * Şirket koduna göre şirket getir
 */
export async function getCompanyByCodeHandler(req, res) {
    try {
        const companyCode = req.params.code;

        const company = await getCompanyByCode(companyCode);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Şirket bulunamadı.',
            });
        }

        res.json({
            success: true,
            message: 'Şirket başarıyla getirildi.',
            data: company,
        });
    } catch (error) {
        console.error('Get company by code error:', error);
        res.status(500).json({
            success: false,
            message: 'Şirket getirilirken bir hata oluştu.',
            error: error.message,
        });
    }
}
export async function updateCompanyStatusHandler(req, res) {
    try {
        const { id } = req.params;
        const { account_status } = req.body; // Doğru field name

        // Validation
        if (!account_status) {
            return res.status(400).json({
                success: false,
                message: 'account_status alanı gereklidir',
            });
        }

        if (!['ACTIVE', 'SUSPENDED'].includes(account_status)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz durum. ACTIVE veya SUSPENDED olmalı',
            });
        }

        const updatedCompany = await updateCompanyStatus(parseInt(id), account_status);

        res.json({
            success: true,
            message: 'Şirket durumu güncellendi',
            data: updatedCompany,
        });
    } catch (error) {
        console.error('Update company status error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Durum güncellenirken hata oluştu',
        });
    }
}

export async function updateCompanyHandler(req, res) {
    try {
        const { id } = req.params;
        const { company_name } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Şirket ID gerekli'
            });
        }

        if (!company_name || company_name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Şirket adı boş olamaz'
            });
        }

        const updatedCompany = await updateCompanyById(id, { company_name });

        return res.status(200).json({
            success: true,
            message: 'Şirket başarıyla güncellendi',
            data: updatedCompany
        });

    } catch (error) {
        console.error('Şirket güncelleme hatası:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Şirket güncellenirken hata oluştu'
        });
    }
}
/**
 * DELETE /api/master/companies/:id/soft
 * Şirketi soft delete yap
 * Not: Şirkete bağlı tüm adminler ve company_employees kayıtları da soft delete edilir.
 */
export async function softDeleteCompanyHandler(req, res) {
    try {
        const companyId = parseInt(req.params.id);

        if (isNaN(companyId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz şirket ID.',
            });
        }

        const deletedCompany = await softDeleteCompany(companyId);

        res.json({
            success: true,
            message: 'Şirket ve bağlı tüm adminler ile company_employees kayıtları başarıyla soft delete yapıldı.',
            data: deletedCompany,
        });
    } catch (error) {
        console.error('Soft delete company error:', error);
        res.status(500).json({
            success: false,
            message: 'Şirket silinirken bir hata oluştu. Bağlı adminler ve company_employees kayıtları da etkilenmiş olabilir.',
            error: error.message,
        });
    }
}

/**
 * PATCH /api/master/companies/:id/restore
 * Soft delete edilmiş şirketi geri yükle
 * Not: Şirkete bağlı tüm adminler ve company_employees kayıtları da geri yüklenir.
 */
export async function restoreCompanyHandler(req, res) {
    try {
        const companyId = parseInt(req.params.id);

        if (isNaN(companyId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz şirket ID.',
            });
        }

        const restoredCompany = await restoreCompany(companyId);

        res.json({
            success: true,
            message: 'Şirket ve bağlı tüm adminler ile company_employees kayıtları başarıyla geri yüklendi.',
            data: restoredCompany,
        });
    } catch (error) {
        console.error('Restore company error:', error);
        res.status(500).json({
            success: false,
            message: 'Şirket geri yüklenirken bir hata oluştu. Bağlı adminler ve company_employees kayıtları da etkilenmiş olabilir.',
            error: error.message,
        });
    }
}

/**
 * DELETE /api/master/companies/:id/hard
 * Şirketi kalıcı olarak sil
 * Not: Şirkete bağlı tüm adminler ve company_employees kayıtları da kalıcı olarak silinir.
 */
export async function hardDeleteCompanyHandler(req, res) {
    try {
        const companyId = parseInt(req.params.id);

        if (isNaN(companyId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz şirket ID.',
            });
        }

        await hardDeleteCompany(companyId);

        res.json({
            success: true,
            message: 'Şirket ve bağlı tüm adminler ile company_employees kayıtları kalıcı olarak silindi.',
        });
    } catch (error) {
        console.error('Hard delete company error:', error);
        res.status(500).json({
            success: false,
            message: 'Şirket silinirken bir hata oluştu. Bağlı adminler ve company_employees kayıtları da etkilenmiş olabilir.',
            error: error.message,
        });
    }
}

// ===========================
// ŞİRKET İSTATİSTİKLERİ
// ===========================

/**
 * GET /api/master/company/stats/counts
 * Şirket istatistikleri (aktif, pasif, silinmiş, toplam)
 */
export async function getCompanyStatsHandler(req, res) {
    try {
        const [active, suspended, deleted, total] = await Promise.all([
            getActiveCompanyCounts(),
            getSuspendedCompanyCounts(),
            getDeletedCompanyCounts(),
            getTotalCompanyCounts(),
        ]);

        res.json({
            success: true,
            data: {
                active,
                suspended,
                deleted,
                total,
            },
        });
    } catch (error) {
        console.error('Get company stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'İstatistikler alınırken hata oluştu',
        });
    }
}

// ===========================
// ŞİRKET ÇALIŞANLARI (ADMINS)
// ===========================

/**
 * GET /api/master/companies/:id/admins
 * Şirkete bağlı adminleri listele
 */
export async function getCompanyAdminsHandler(req, res) {
    try {
        const companyId = parseInt(req.params.id);

        if (isNaN(companyId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz şirket ID.',
            });
        }

        const filters = {
            includeDeleted: req.query.includeDeleted === 'true',
            status: req.query.status || null,
        };

        const admins = await getCompanyAdmins(companyId, filters);

        res.json({
            success: true,
            message: 'Şirket adminleri başarıyla getirildi.',
            data: admins,
        });
    } catch (error) {
        console.error('Get company admins error:', error);
        res.status(500).json({
            success: false,
            message: 'Adminler getirilirken bir hata oluştu.',
            error: error.message,
        });
    }
}

/**
 * PATCH /api/master/admins/:id/role
 * Admin rolünü değiştir
 */
export async function updateAdminRoleHandler(req, res) {
    try {
        const adminId = parseInt(req.params.id);
        const { role } = req.body;

        if (isNaN(adminId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz admin ID.',
            });
        }

        const validRoles = ['INDIVIDUAL', 'COMPANY_MANAGER', 'COMPANY_EMPLOYEE', 'SITE_USER'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz rol.',
            });
        }

        const updatedAdmin = await updateAdminRole(adminId, role);

        res.json({
            success: true,
            message: 'Admin rolü başarıyla güncellendi.',
            data: updatedAdmin,
        });
    } catch (error) {
        console.error('Update admin role error:', error);
        res.status(500).json({
            success: false,
            message: 'Admin rolü güncellenirken bir hata oluştu.',
            error: error.message,
        });
    }
}


/**
 * PATCH /api/master/admins/:id/restore
 * Soft delete edilmiş admin'i geri yükle
 */
export async function restoreAdminHandler(req, res) {
    try {
        const adminId = parseInt(req.params.id);

        if (isNaN(adminId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz admin ID.',
            });
        }

        const restoredAdmin = await restoreAdmin(adminId);

        res.json({
            success: true,
            message: 'Admin başarıyla geri yüklendi.',
            data: restoredAdmin,
        });
    } catch (error) {
        console.error('Restore admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Admin geri yüklenirken bir hata oluştu.',
            error: error.message,
        });
    }
}

/**
 * DELETE /api/master/admins/:id/hard
 * Admin'i kalıcı olarak sil
 */
export async function hardDeleteAdminHandler(req, res) {
    try {
        const adminId = parseInt(req.params.id);

        if (isNaN(adminId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz admin ID.',
            });
        }

        await hardDeleteAdmin(adminId);

        res.json({
            success: true,
            message: 'Admin kalıcı olarak silindi.',
        });
    } catch (error) {
        console.error('Hard delete admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Admin silinirken bir hata oluştu.',
            error: error.message,
        });
    }
}

// ===========================
// ŞİRKET SİTELERİ
// ===========================

/**
 * GET /api/master/companies/:id/sites
 * Şirkete bağlı siteleri listele
 */
export async function getCompanySitesHandler(req, res) {
    try {
        const companyId = parseInt(req.params.id);

        if (isNaN(companyId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz şirket ID.',
            });
        }

        const filters = {
            includeDeleted: req.query.includeDeleted === 'true',
            status: req.query.status || null,
        };

        const sites = await getCompanySites(companyId, filters);

        res.json({
            success: true,
            message: 'Şirket siteleri başarıyla getirildi.',
            data: sites,
        });
    } catch (error) {
        console.error('Get company sites error:', error);
        res.status(500).json({
            success: false,
            message: 'Siteler getirilirken bir hata oluştu.',
            error: error.message,
        });
    }
}

/**
 * PATCH /api/master/sites/:id/restore
 * Soft delete edilmiş site'yi geri yükle
 */
export async function restoreSiteHandler(req, res) {
    try {
        const siteId = parseInt(req.params.id);

        if (isNaN(siteId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz site ID.',
            });
        }

        const restoredSite = await restoreSite(siteId);

        res.json({
            success: true,
            message: 'Site başarıyla geri yüklendi.',
            data: restoredSite,
        });
    } catch (error) {
        console.error('Restore site error:', error);
        res.status(500).json({
            success: false,
            message: 'Site geri yüklenirken bir hata oluştu.',
            error: error.message,
        });
    }
}

/**
 * DELETE /api/master/sites/:id/hard
 * Site'yi kalıcı olarak sil
 */
export async function hardDeleteSiteHandler(req, res) {
    try {
        const siteId = parseInt(req.params.id);

        if (isNaN(siteId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz site ID.',
            });
        }

        await hardDeleteSite(siteId);

        res.json({
            success: true,
            message: 'Site kalıcı olarak silindi.',
        });
    } catch (error) {
        console.error('Hard delete site error:', error);
        res.status(500).json({
            success: false,
            message: 'Site silinirken bir hata oluştu.',
            error: error.message,
        });
    }
}

/**
 * GET /api/master/companies/:id/employees
 * Şirkete bağlı çalışanları (company_employees) listele
 */
export async function getCompanyEmployeesHandler(req, res) {
    try {
        const companyId = parseInt(req.params.id);

        if (isNaN(companyId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz şirket ID.',
            });
        }

        const filters = {
            includeDeleted: req.query.includeDeleted === 'true',
            status: req.query.status || null,
        };

        const employees = await getCompanyEmployees(companyId, filters);

        res.json({
            success: true,
            message: 'Şirket çalışanları başarıyla getirildi.',
            data: employees,
        });
    } catch (error) {
        console.error('Get company employees error:', error);
        res.status(500).json({
            success: false,
            message: 'Çalışanlar getirilirken bir hata oluştu.',
            error: error.message,
        });
    }
}
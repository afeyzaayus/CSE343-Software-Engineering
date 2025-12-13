import prisma from '../../../prisma/prismaClient.js';

// ===========================
// ŞİRKET YÖNETİMİ
// ===========================

/**
 * Tüm şirketleri getir (aktif, askıda, silinmiş dahil)
 * @param {Object} filters - { includeDeleted: boolean, status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' | null }
 */
export async function getAllCompanies(filters = {}) {
    const where = {};

    // Silinmiş kayıtları dahil et/etme
    if (!filters.includeDeleted) {
        where.deleted_at = null;
    }

    // Durum filtresi
    if (filters.status) {
        where.account_status = filters.status;
    }

    const companies = await prisma.companies.findMany({
        where,
        include: {
            admins: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    account_type: true,
                    account_status: true,
                    deleted_at: true,
                },
            },
            sites: {
                select: {
                    id: true,
                    site_name: true,
                    site_address: true,
                    site_status: true,
                    deleted_at: true,
                },
            },
        },
        orderBy: { created_at: 'desc' },
    });

    return companies;
}

/**
 * ID'ye göre tek bir şirket getir
 */
export async function getCompanyById(companyId) {
    const company = await prisma.companies.findUnique({
        where: { id: companyId },
        include: {
            admins: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    account_type: true,
                    account_status: true,
                    deleted_at: true,
                    last_login: true,
                },
            },
            sites: {
                select: {
                    id: true,
                    site_name: true,
                    site_address: true,
                    site_status: true,
                    apartment_count: true,
                    block_count: true,
                    deleted_at: true,
                },
            },
        },
    });

    return company;
}

/**
 * Şirket kodu ile şirket getir
 */
export async function getCompanyByCode(companyCode) {
    const company = await prisma.companies.findUnique({
        where: { company_code: companyCode },
        include: {
            admins: true,
            sites: true,
        },
    });
    return company;
}


/**
 * Şirket durumunu güncelle (ACTIVE / SUSPENDED)
 * İlişkili tüm siteler ve çalışanlar da aynı duruma güncellenir
 */
export async function updateCompanyStatus(companyId, status) {
    const result = await prisma.$transaction(async (tx) => {
        // Şirket durumunu güncelle
        const updatedCompany = await tx.companies.update({
            where: { id: companyId },
            data: { account_status: status },
        });

        // İlişkili tüm sitelerin durumunu güncelle
        await tx.site.updateMany({
            where: { 
                company_id: companyId,
                deleted_at: null // Silinmiş siteleri etkileme
            },
            data: { 
                site_status: status 
            },
        });

        // İlişkili tüm çalışanların durumunu güncelle
        await tx.admin.updateMany({
            where: { 
                companyId: companyId,
                deleted_at: null // Silinmiş çalışanları etkileme
            },
            data: { 
                account_status: status 
            },
        });

        return updatedCompany;
    });

    return result;
}

/**
 * Şirketi soft delete yap (deleted_at doldur)
 * İlişkili tüm siteler, çalışanlar ve site kullanıcıları da soft delete edilir
 */
export async function softDeleteCompany(companyId) {
    const now = new Date();
    
    const result = await prisma.$transaction(async (tx) => {
        // Önce şirkete bağlı tüm sitelerin ID'lerini al
        const sites = await tx.site.findMany({
            where: { company_id: companyId },
            select: { id: true },
        });
        const siteIds = sites.map(site => site.id);

        // Site kullanıcılarını soft delete yap
        if (siteIds.length > 0) {
            await tx.user.updateMany({
                where: { siteId: { in: siteIds } }, // site_id değil siteId
                data: { 
                    deleted_at: now,
                    account_status: 'DELETED'
                },
            });
        }

        // Siteleri soft delete yap
        await tx.site.updateMany({
            where: { company_id: companyId },
            data: { 
                deleted_at: now,
                site_status: 'DELETED'
            },
        });

        // Çalışanları soft delete yap
        await tx.admin.updateMany({
            where: { companyId: companyId },
            data: { 
                deleted_at: now,
                account_status: 'DELETED'
            },
        });

        // Şirketi soft delete yap
        const deletedCompany = await tx.companies.update({
            where: { id: companyId },
            data: { 
                deleted_at: now,
                account_status: 'DELETED'
            },
        });

        return deletedCompany;
    });

    return result;
}

/**
 * Soft delete edilmiş şirketi geri yükle
 * İlişkili tüm siteler, çalışanlar ve site kullanıcıları da geri yüklenir
 */
export async function restoreCompany(companyId) {
    const result = await prisma.$transaction(async (tx) => {
        // Şirketi geri yükle
        const restoredCompany = await tx.companies.update({
            where: { id: companyId },
            data: { 
                deleted_at: null,
                account_status: 'ACTIVE'
            },
        });

        // Önce şirkete bağlı tüm sitelerin ID'lerini al
        const sites = await tx.site.findMany({
            where: { 
                company_id: companyId,
                deleted_at: { not: null }
            },
            select: { id: true },
        });
        const siteIds = sites.map(site => site.id);

        // Siteleri geri yükle
        await tx.site.updateMany({
            where: { 
                company_id: companyId,
                deleted_at: { not: null }
            },
            data: { 
                deleted_at: null,
                site_status: 'ACTIVE'
            },
        });

        // Çalışanları geri yükle
        await tx.admin.updateMany({
            where: { 
                companyId: companyId,
                deleted_at: { not: null }
            },
            data: { 
                deleted_at: null,
                account_status: 'ACTIVE'
            },
        });

        // Site kullanıcılarını geri yükle
        if (siteIds.length > 0) {
            await tx.user.updateMany({
                where: { 
                    siteId: { in: siteIds }, // site_id değil siteId
                    deleted_at: { not: null }
                },
                data: { 
                    deleted_at: null,
                    account_status: 'ACTIVE'
                },
            });
        }

        return restoredCompany;
    });

    return result;
}

/**
 * Şirketi hard delete yap (veritabanından tamamen sil)
 * İlişkili tüm siteler, çalışanlar ve site kullanıcıları da kalıcı olarak silinir
 */
export async function hardDeleteCompany(companyId) {
    const result = await prisma.$transaction(async (tx) => {
        // Önce şirkete bağlı tüm sitelerin ID'lerini al
        const sites = await tx.site.findMany({
            where: { company_id: companyId },
            select: { id: true },
        });
        const siteIds = sites.map(site => site.id);

        // Site kullanıcılarını kalıcı olarak sil
        if (siteIds.length > 0) {
            await tx.user.deleteMany({
                where: { siteId: { in: siteIds } }, // site_id değil siteId
            });
        }

        // Çalışanları kalıcı olarak sil
        await tx.admin.deleteMany({
            where: { companyId: companyId },
        });

        // Siteleri kalıcı olarak sil
        await tx.site.deleteMany({
            where: { company_id: companyId },
        });

        // Şirketi kalıcı olarak sil
        const deletedCompany = await tx.companies.delete({
            where: { id: companyId },
        });

        return deletedCompany;
    });

    return result;
}

// ===========================
// ŞİRKET İSTATİSTİKLERİ
// ===========================

export async function getActiveCompanyCounts() {
    return await prisma.companies.count({
        where: {
            account_status: 'ACTIVE',
            deleted_at: null,
        },
    });
}

export async function getSuspendedCompanyCounts() {
    return await prisma.companies.count({
        where: {
            account_status: 'SUSPENDED',
            deleted_at: null,
        },
    });
}

export async function getDeletedCompanyCounts() {
    return await prisma.companies.count({
        where: {
            deleted_at: { not: null },
        },
    });
}

export async function getTotalCompanyCounts() {
    return await prisma.companies.count();
}

// ...existing code...

// Şirket bilgilerini güncelle
export async function updateCompanyById(companyId, updateData) {
    try {
        const company = await prisma.companies.findUnique({
            where: { id: parseInt(companyId) }
        });

        if (!company) {
            throw new Error('Şirket bulunamadı');
        }

        const updatedCompany = await prisma.companies.update({
            where: { id: parseInt(companyId) },
            data: {
                company_name: updateData.company_name,
                updated_at: new Date()
            },
            select: {
                id: true,
                company_name: true,
                company_code: true,
                account_status: true,
                created_at: true,
                updated_at: true,
                deleted_at: true
            }
        });

        return updatedCompany;
    } catch (error) {
        console.error('Şirket güncelleme hatası:', error);
        throw error;
    }
}

// ...existing code...

// ===========================
// ŞİRKET ÇALIŞANLARI (ADMINS)
// ===========================

/**
 * Şirkete bağlı tüm adminleri getir
 */
export async function getCompanyAdmins(companyId, filters = {}) {
    const where = { companyId };

    if (!filters.includeDeleted) {
        where.deleted_at = null;
    }

    if (filters.status) {
        where.account_status = filters.status;
    }

    const admins = await prisma.admin.findMany({
        where,
        select: {
            id: true,
            full_name: true,
            email: true,
            account_type: true,
            account_status: true,
            company_name: true,
            company_code: true,
            created_at: true,
            deleted_at: true,
            last_login: true,
        },
        orderBy: { created_at: 'desc' },
    });

    return admins;
}

/**
 * Admin rolünü değiştir
 * Sadece admin etkilenir, bağlı kayıtlar etkilenmez
 */
export async function updateAdminRole(adminId, newRole) {
    const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: { account_type: newRole },
    });
    return updatedAdmin;
}

/**
 * Admin durumunu değiştir (ACTIVE / SUSPENDED)
 * Sadece admin etkilenir, bağlı kayıtlar etkilenmez
 */
export async function updateAdminStatus(adminId, status) {
    const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: { account_status: status },
    });
    return updatedAdmin;
}

/**
 * Admin'i soft delete yap
 * Sadece admin etkilenir, bağlı kayıtlar etkilenmez
 */
export async function softDeleteAdmin(adminId) {
    const deletedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: { 
            deleted_at: new Date(),
            account_status: 'DELETED'
        },
    });
    return deletedAdmin;
}

/**
 * Soft delete edilmiş admin'i geri yükle
 * Sadece admin etkilenir, bağlı kayıtlar etkilenmez
 */
export async function restoreAdmin(adminId) {
    const restoredAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: { 
            deleted_at: null,
            account_status: 'ACTIVE'
        },
    });
    return restoredAdmin;
}

/**
 * Admin'i hard delete yap
 * Sadece admin etkilenir, bağlı kayıtlar etkilenmez
 */
export async function hardDeleteAdmin(adminId) {
    const deletedAdmin = await prisma.admin.delete({
        where: { id: adminId },
    });
    return deletedAdmin;
}

// ===========================
// ŞİRKET SİTELERİ
// ===========================

/**
 * Şirkete bağlı tüm siteleri getir
 */
export async function getCompanySites(companyId, filters = {}) {
    const where = { company_id: companyId };

    if (!filters.includeDeleted) {
        where.deleted_at = null;
    }

    if (filters.status) {
        where.site_status = filters.status;
    }

    const sites = await prisma.site.findMany({
        where,
        select: {
            id: true,
            site_id: true,
            site_name: true,
            site_address: true,
            site_status: true,
            apartment_count: true,
            block_count: true,
            created_at: true,
            deleted_at: true,
        },
        orderBy: { created_at: 'desc' },
    });

    return sites;
}


/**
 * Site durumunu değiştir
 * İlişkili tüm kullanıcılar da aynı duruma güncellenir
 */
export async function updateSiteStatus(siteId, status) {
    const result = await prisma.$transaction(async (tx) => {
        // Site durumunu güncelle
        const updatedSite = await tx.site.update({
            where: { id: siteId },
            data: { site_status: status },
        });

        // İlişkili tüm kullanıcıların durumunu güncelle
        await tx.user.updateMany({
            where: { 
                siteId: siteId, // site_id değil siteId
                deleted_at: null
            },
            data: { 
                account_status: status 
            },
        });

        return updatedSite;
    });

    return result;
}

/**
 * Site'yi soft delete yap
 * İlişkili tüm kullanıcılar da soft delete edilir
 */
export async function softDeleteSite(siteId) {
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
        // Kullanıcıları soft delete yap
        await tx.user.updateMany({
            where: { siteId: siteId }, // site_id değil siteId
            data: { 
                deleted_at: now,
                account_status: 'DELETED'
            },
        });

        // Site'yi soft delete yap
        const deletedSite = await tx.site.update({
            where: { id: siteId },
            data: { 
                deleted_at: now,
                site_status: 'DELETED'
            },
        });

        return deletedSite;
    });

    return result;
}

/**
 * Soft delete edilmiş site'yi geri yükle
 * İlişkili tüm kullanıcılar da geri yüklenir
 */
export async function restoreSite(siteId) {
    const result = await prisma.$transaction(async (tx) => {
        // Site'yi geri yükle
        const restoredSite = await tx.site.update({
            where: { id: siteId },
            data: { 
                deleted_at: null,
                site_status: 'ACTIVE'
            },
        });

        // Kullanıcıları geri yükle
        await tx.user.updateMany({
            where: { 
                siteId: siteId, // site_id değil siteId
                deleted_at: { not: null }
            },
            data: { 
                deleted_at: null,
                account_status: 'ACTIVE'
            },
        });

        return restoredSite;
    });

    return result;
}

/**
 * Site'yi hard delete yap
 * İlişkili tüm kullanıcılar da kalıcı olarak silinir
 */
export async function hardDeleteSite(siteId) {
    const result = await prisma.$transaction(async (tx) => {
        // Kullanıcıları kalıcı olarak sil
        await tx.user.deleteMany({
            where: { siteId: siteId }, // site_id değil siteId
        });

        // Site'yi kalıcı olarak sil
        const deletedSite = await tx.site.delete({
            where: { id: siteId },
        });

        return deletedSite;
    });

    return result;
}

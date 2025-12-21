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

    // Şirketleri çek
    const companies = await prisma.companies.findMany({
        where,
        include: {
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

    // Her şirket için company_employees ve admin bilgilerini ekle
    for (const company of companies) {
        // company_employees kayıtlarını çek
        const employees = await prisma.company_employees.findMany({
            where: { company_id: company.id, deleted_at: null },
        });
        const adminIds = employees.map(e => e.admin_id);

        // Admin bilgilerini çek
        let adminsMap = {};
        if (adminIds.length > 0) {
            const admins = await prisma.admin.findMany({
                where: { id: { in: adminIds } },
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    account_type: true,
                    account_status: true,
                    deleted_at: true,
                    last_login: true,
                },
            });
            adminsMap = admins.reduce((acc, admin) => {
                acc[admin.id] = admin;
                return acc;
            }, {});
        }

        // Her employee kaydına admin bilgisini ekle
        company.employees = employees.map(emp => ({
            ...emp,
            admin: adminsMap[emp.admin_id] || null
        }));
    }

    return companies;
}

/**
 * ID'ye göre tek bir şirket getir
 */
export async function getCompanyById(companyId) {
    // Şirketi çek
    const company = await prisma.companies.findUnique({
        where: { id: companyId },
        include: {
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

    if (!company) return null;

    // company_employees kayıtlarını çek
    const employees = await prisma.company_employees.findMany({
        where: { company_id: company.id, deleted_at: null },
    });
    const adminIds = employees.map(e => e.admin_id);

    // Admin bilgilerini çek
    let adminsMap = {};
    if (adminIds.length > 0) {
        const admins = await prisma.admin.findMany({
            where: { id: { in: adminIds } },
            select: {
                id: true,
                full_name: true,
                email: true,
                account_type: true,
                account_status: true,
                deleted_at: true,
                last_login: true,
            },
        });
        adminsMap = admins.reduce((acc, admin) => {
            acc[admin.id] = admin;
            return acc;
        }, {});
    }

    // Her employee kaydına admin bilgisini ekle
    company.employees = employees.map(emp => ({
        ...emp,
        admin: adminsMap[emp.admin_id] || null
    }));

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
                deleted_at: null
            },
            data: { 
                site_status: status 
            },
        });

        // company_employees üzerinden çalışanları güncelle
        await tx.company_employees.updateMany({
            where: { 
                company_id: companyId,
                deleted_at: null
            },
            data: { 
                status: status 
            },
        });

        // company_employees ile ilişkili admin'leri güncelle
        const employees = await tx.company_employees.findMany({
            where: { company_id: companyId, deleted_at: null },
            select: { admin_id: true }
        });
        const adminIds = employees.map(e => e.admin_id).filter(Boolean);
        if (adminIds.length > 0) {
            await tx.admin.updateMany({
                where: { id: { in: adminIds }, deleted_at: null },
                data: { account_status: status }
            });
        }

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
                where: { siteId: { in: siteIds } },
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

        // company_employees üzerinden çalışanları soft delete yap
        const employees = await tx.company_employees.findMany({
            where: { company_id: companyId },
            select: { id: true, admin_id: true }
        });
        const employeeIds = employees.map(e => e.id);
        const adminIds = employees.map(e => e.admin_id).filter(Boolean);

        if (employeeIds.length > 0) {
            await tx.company_employees.updateMany({
                where: { id: { in: employeeIds } },
                data: {
                    deleted_at: now,
                    status: 'DELETED'
                }
            });
        }

        // company_employees ile ilişkili admin'leri soft delete yap
        if (adminIds.length > 0) {
            await tx.admin.updateMany({
                where: { id: { in: adminIds } },
                data: { 
                    deleted_at: now,
                    account_status: 'DELETED'
                },
            });
        }

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

        // company_employees üzerinden çalışanları geri yükle
        const employees = await tx.company_employees.findMany({
            where: { company_id: companyId, deleted_at: { not: null } },
            select: { id: true, admin_id: true }
        });
        const employeeIds = employees.map(e => e.id);
        const adminIds = employees.map(e => e.admin_id).filter(Boolean);

        if (employeeIds.length > 0) {
            await tx.company_employees.updateMany({
                where: { id: { in: employeeIds } },
                data: {
                    deleted_at: null,
                    status: 'ACTIVE'
                }
            });
        }

        // company_employees ile ilişkili admin'leri geri yükle
        if (adminIds.length > 0) {
            await tx.admin.updateMany({
                where: { id: { in: adminIds }, deleted_at: { not: null } },
                data: { 
                    deleted_at: null,
                    account_status: 'ACTIVE'
                },
            });
        }

        // Site kullanıcılarını geri yükle
        if (siteIds.length > 0) {
            await tx.user.updateMany({
                where: { 
                    siteId: { in: siteIds },
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
                where: { siteId: { in: siteIds } },
            });
        }

        // company_employees üzerinden admin'leri bul
        const employees = await tx.company_employees.findMany({
            where: { company_id: companyId },
            select: { admin_id: true }
        });
        const adminIds = employees.map(e => e.admin_id).filter(Boolean);

        // Önce company_employees kayıtlarını sil
        await tx.company_employees.deleteMany({
            where: { company_id: companyId },
        });

        // Sonra admin kayıtlarını sil
        if (adminIds.length > 0) {
            await tx.admin.deleteMany({
                where: { id: { in: adminIds } },
            });
        }

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

// ===========================
// ŞİRKET BİLGİLERİ
// ===========================

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

// ===========================
// ŞİRKET ÇALIŞANLARI (ADMINS)
// ===========================


/**
 * Admin rolünü değiştir
 * Sadece admin etkilenir, bağlı kayıtlar etkilenmez
 * GÜNCELLENDİ: company_employees kaydı da güncellenir
 */
export async function updateAdminRole(adminId, newRole) {
    // Transaction ile hem admin hem company_employees güncelle
    const result = await prisma.$transaction(async (tx) => {
        const updatedAdmin = await tx.admin.update({
            where: { id: adminId },
            data: { account_type: newRole },
        });

        // company_employees tablosunda role alanı yoksa, burada sadece güncelleme yapılmaz veya başka bir alan güncellenir
        // Eğer sadece admin_id ile eşleşen kayıtlar varsa, burada bir işlem yapmaya gerek yok
        // İsterseniz log ekleyebilirsiniz veya bu kısmı tamamen kaldırabilirsiniz

        return updatedAdmin;
    });

    return result;
}

/**
 * Soft delete edilmiş admin'i geri yükle
 * Admin ve bağlı company_employees kaydını geri aktif eder
 */
export async function restoreAdmin(adminId) {
    // Admin kaydını bul
    const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { id: true }
    });
    if (!admin) throw new Error('Admin bulunamadı');

    // company_employees kaydını bul
    const employee = await prisma.company_employees.findFirst({
        where: { admin_id: adminId }
    });

    // Transaction ile hem admin hem employee kaydını geri yükle
    const result = await prisma.$transaction(async (tx) => {
        const restoredAdmin = await tx.admin.update({
            where: { id: adminId },
            data: { 
                deleted_at: null,
                account_status: 'ACTIVE'
            },
        });

        let restoredEmployee = null;
        if (employee) {
            restoredEmployee = await tx.company_employees.update({
                where: { id: employee.id },
                data: {
                    status: 'ACTIVE',
                    deleted_at: null
                }
            });
        }

        return { restoredAdmin, restoredEmployee };
    });

    return result;
}

/**
 * Admin'i hard delete yap
 * Sadece admin etkilenir, bağlı company_employees kaydı da silinir
 */
export async function hardDeleteAdmin(adminId) {
    const result = await prisma.$transaction(async (tx) => {
        // Önce company_employees kaydını sil
        await tx.company_employees.deleteMany({
            where: { admin_id: adminId }
        });

        // Sonra admin kaydını sil
        const deletedAdmin = await tx.admin.delete({
            where: { id: adminId },
        });

        return deletedAdmin;
    });

    return result;
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

/**
 * Şirkete bağlı tüm çalışanları getir (company_employees tablosundan)
 * Her çalışan için admin bilgilerini de getirir
 */
export async function getCompanyEmployees(companyId, filters = {}) {
    const where = { company_id: companyId };

    if (!filters.includeDeleted) {
        where.deleted_at = null;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    // Önce çalışanları çek
    const employees = await prisma.company_employees.findMany({
        where,
        orderBy: { joined_at: 'desc' },
    });

    // Admin id'lerini topla
    const adminIds = employees.map(e => e.admin_id);

    // Admin bilgilerini topluca çek
    let adminsMap = {};
    if (adminIds.length > 0) {
        const admins = await prisma.admin.findMany({
            where: { id: { in: adminIds } },
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
            }
        });
        // Map admin_id -> admin
        adminsMap = admins.reduce((acc, admin) => {
            acc[admin.id] = admin;
            return acc;
        }, {});
    }

    // Her employee kaydına admin bilgisini ekle
    const employeesWithAdmin = employees.map(emp => ({
        ...emp,
        admin: adminsMap[emp.admin_id] || null
    }));

    return employeesWithAdmin;
}

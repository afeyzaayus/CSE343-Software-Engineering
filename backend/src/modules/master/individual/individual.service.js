import prisma from '../../../prisma/prismaClient.js';

/**
 * Tüm bireysel hesapları getir (aktif, askıda, silinmiş dahil)
 * @param {Object} filters - { includeDeleted: boolean, status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' | null }
 */
export async function getAllIndividuals(filters = {}) {
    const whereClause = {};
    
    if (filters.status && filters.status !== 'DELETED') {
        whereClause.account_status = filters.status;
    }
    
    if (filters.status === 'DELETED') {
        whereClause.deleted_at = { not: null };
    } else if (!filters.includeDeleted) {
        whereClause.deleted_at = null;
    }
    
    const individuals = await prisma.individuals.findMany({
        where: whereClause,
        include: {
            admin: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    account_type: true,
                    account_status: true,
                    deleted_at: true,
                    last_login: true,
                }
            },
            site: {
                select: {
                    id: true,
                    site_name: true,
                    site_address: true,
                    site_status: true,
                    deleted_at: true,
                }
            }
        },
        orderBy: { created_at: 'desc' },
    });
    
    // Admin bilgilerini üst seviyeye taşı
    return individuals.map(ind => ({
        id: ind.id,
        full_name: ind.admin?.full_name || 'N/A',
        email: ind.admin?.email || 'N/A',
        account_status: ind.account_status,
        expiry_date: ind.expiry_date,
        created_at: ind.created_at,
        updated_at: ind.updated_at,
        deleted_at: ind.deleted_at,
        admin: ind.admin,
        site: ind.site
    }));
}

/**
 * ID'ye göre tek bir individual getir
 */
export async function getIndividualById(id) {
    const individual = await prisma.individuals.findUnique({
        where: { id: parseInt(id) },
        include: {
            admin: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    account_type: true,
                    account_status: true,
                    deleted_at: true,
                    last_login: true,
                }
            },
            site: {
                select: {
                    id: true,
                    site_name: true,
                    site_address: true,
                    site_status: true,
                    apartment_count: true,
                    block_count: true,
                    deleted_at: true,
                }
            }
        }
    });
    
    if (!individual) return null;
    
    // Admin bilgilerini üst seviyeye taşı
    return {
        id: individual.id,
        full_name: individual.admin?.full_name || 'N/A',
        email: individual.admin?.email || 'N/A',
        account_status: individual.account_status,
        expiry_date: individual.expiry_date,
        created_at: individual.created_at,
        updated_at: individual.updated_at,
        deleted_at: individual.deleted_at,
        admin: individual.admin,
        site: individual.site
    };
}

/**
 * Individual durumunu güncelle (ACTIVE / SUSPENDED)
 * İlişkili admin, site ve siteye bağlı user'lar da aynı duruma güncellenir
 */
export async function updateIndividualStatus(individualId, status) {
    const id = parseInt(individualId);
    return await prisma.$transaction(async (tx) => {
        // Individual güncelle
        const updatedIndividual = await tx.individuals.update({
            where: { id },
            data: { account_status: status },
        });

        // İlişkili admin güncelle
        await tx.admin.updateMany({
            where: { individualId: id, deleted_at: null },
            data: { account_status: status },
        });

        // İlişkili siteyi bul ve güncelle
        const site = await tx.site.findFirst({
            where: { individual_id: id, deleted_at: null }
        });
        if (site) {
            await tx.site.update({
                where: { id: site.id },
                data: { site_status: status }
            });

            // Siteye bağlı user'ları güncelle
            await tx.user.updateMany({
                where: { siteId: site.id, deleted_at: null },
                data: { account_status: status }
            });
        }

        return updatedIndividual;
    });
}

/**
 * Individual'ı soft delete yap
 * İlişkili admin, site ve siteye bağlı user'lar da soft delete edilir
 */
export async function softDeleteIndividual(individualId) {
    const id = parseInt(individualId);
    const now = new Date();
    return await prisma.$transaction(async (tx) => {
        // Individual soft delete
        const deletedIndividual = await tx.individuals.update({
            where: { id },
            data: {
                deleted_at: now,
                account_status: 'DELETED',
                updated_at: now
            }
        });

        // İlişkili admin soft delete
        await tx.admin.updateMany({
            where: { individualId: id, deleted_at: null },
            data: {
                deleted_at: now,
                account_status: 'DELETED'
            }
        });

        // İlişkili siteyi bul ve soft delete
        const site = await tx.site.findFirst({
            where: { individual_id: id, deleted_at: null }
        });
        if (site) {
            await tx.site.update({
                where: { id: site.id },
                data: {
                    deleted_at: now,
                    site_status: 'DELETED'
                }
            });

            // Siteye bağlı user'ları soft delete
            await tx.user.updateMany({
                where: { siteId: site.id, deleted_at: null },
                data: {
                    deleted_at: now,
                    account_status: 'DELETED'
                }
            });
        }

        return deletedIndividual;
    });
}

/**
 * Soft delete edilmiş individual'ı geri yükle
 * İlişkili admin, site ve siteye bağlı user'lar da geri yüklenir
 */
export async function restoreIndividual(individualId) {
    const id = parseInt(individualId);
    return await prisma.$transaction(async (tx) => {
        // Individual restore
        const restoredIndividual = await tx.individuals.update({
            where: { id },
            data: {
                deleted_at: null,
                account_status: 'ACTIVE',
                updated_at: new Date()
            }
        });

        // İlişkili admin restore
        await tx.admin.updateMany({
            where: { individualId: id, deleted_at: { not: null } },
            data: {
                deleted_at: null,
                account_status: 'ACTIVE'
            }
        });

        // İlişkili siteyi bul ve restore
        const site = await tx.site.findFirst({
            where: { individual_id: id, deleted_at: { not: null } }
        });
        if (site) {
            await tx.site.update({
                where: { id: site.id },
                data: {
                    deleted_at: null,
                    site_status: 'ACTIVE'
                }
            });

            // Siteye bağlı user'ları restore
            await tx.user.updateMany({
                where: { siteId: site.id, deleted_at: { not: null } },
                data: {
                    deleted_at: null,
                    account_status: 'ACTIVE'
                }
            });
        }

        return restoredIndividual;
    });
}
export async function hardDeleteIndividual(individualId) {
    const id = parseInt(individualId);
    return await prisma.$transaction(async (tx) => {
        // Individual kaydını al (site_id ve admin_id için)
        const individual = await tx.individuals.findUnique({
            where: { id },
            select: { admin_id: true }
        });

        // Bireysel hesaba bağlı tüm siteleri bul
        const sites = await tx.site.findMany({
            where: { individual_id: id }
        });

        // Her site için önce user'ları sil, sonra siteyi sil
        for (const site of sites) {
            await tx.user.deleteMany({
                where: { siteId: site.id }
            });
            await tx.site.delete({
                where: { id: site.id }
            });
        }

        // Önce individuals tablosunda admin_id'yi null yap
        if (individual?.admin_id) {
            await tx.individuals.update({
                where: { id },
                data: { admin_id: null }
            });
            // Sonra admin'i sil
            await tx.admin.delete({
                where: { id: individual.admin_id }
            });
        }

        // En son individual'ı sil
        await tx.individuals.delete({
            where: { id }
        });

        return { success: true };
    });
}
/**
 * Individual istatistikleri
 */
export async function getIndividualStatistics() {
    const total = await prisma.individuals.count();
    const active = await prisma.individuals.count({
        where: { account_status: 'ACTIVE', deleted_at: null }
    });
    const suspended = await prisma.individuals.count({
        where: { account_status: 'SUSPENDED', deleted_at: null }
    });
    const deleted = await prisma.individuals.count({
        where: { deleted_at: { not: null } }
    });
    return { total, active, suspended, deleted };
}

/**
 * Individual'a bağlı site'yi getir
 */
export async function getSiteByIndividualId(individualId) {
    const individual = await prisma.individuals.findUnique({
        where: { id: parseInt(individualId) },
        include: {
            site: {
                select: {
                    id: true,
                    site_name: true,
                    site_address: true,
                    site_status: true,
                    apartment_count: true,
                    block_count: true,
                    created_at: true,
                    updated_at: true,
                    deleted_at: true
                }
            }
        }
    });
    
    if (!individual) {
        throw new Error('Bireysel hesap bulunamadı');
    }
    
    return individual.site || null;
}

/**
 * Individual'a bağlı birden fazla siteyi getir
 */
export async function getSitesByIndividualId(individualId) {
    const sites = await prisma.site.findMany({
        where: { individual_id: parseInt(individualId) },
        select: {
            id: true,
            site_name: true,
            site_address: true,
            site_status: true,
            apartment_count: true,
            block_count: true,
            created_at: true,
            updated_at: true,
            deleted_at: true
        }
    });

    return sites;
}

/**
 * Site durumunu güncelle
 */
export async function updateSiteStatus(siteId, status) {
    const site = await prisma.site.update({
        where: { id: parseInt(siteId) },
        data: { site_status: status },
    });
    return site;
}

/**
 * Site'yi soft delete yap
 */
export async function softDeleteSite(siteId) {
    const site = await prisma.site.update({
        where: { id: parseInt(siteId) },
        data: { 
            deleted_at: new Date(),
            site_status: 'DELETED'
        },
    });
    return site;
}

/**
 * Site'yi geri yükle
 */
export async function restoreSite(siteId) {
    const site = await prisma.site.update({
        where: { id: parseInt(siteId) },
        data: { 
            deleted_at: null,
            site_status: 'ACTIVE'
        },
    });
    return site;
}

/**
 * Site'yi hard delete yap
 */
export async function hardDeleteSite(siteId) {
    const site = await prisma.site.delete({
        where: { id: parseInt(siteId) },
    });
    return site;
}
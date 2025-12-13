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
 * İlişkili admin ve site de aynı duruma güncellenir
 */
export async function updateIndividualStatus(id, status) {
    const result = await prisma.$transaction(async (tx) => {
        // Individual durumunu güncelle
        const updatedIndividual = await tx.individuals.update({
            where: { id: parseInt(id) },
            data: { 
                account_status: status,
                updated_at: new Date()
            },
            include: { 
                admin: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        account_type: true,
                        account_status: true,
                    }
                }
            }
        });

        // İlişkili admin'in durumunu güncelle
        if (updatedIndividual.admin_id) {
            await tx.admin.update({
                where: { id: updatedIndividual.admin_id },
                data: { account_status: status }
            });
        }

        // İlişkili site'nin durumunu güncelle (varsa)
        if (updatedIndividual.site_id) {
            await tx.site.update({
                where: { id: updatedIndividual.site_id },
                data: { site_status: status }
            });
        }

        return {
            id: updatedIndividual.id,
            full_name: updatedIndividual.admin?.full_name || 'N/A',
            email: updatedIndividual.admin?.email || 'N/A',
            account_status: updatedIndividual.account_status,
            expiry_date: updatedIndividual.expiry_date,
            updated_at: updatedIndividual.updated_at
        };
    });

    return result;
}

/**
 * Individual'ı soft delete yap
 * İlişkili admin ve site de soft delete edilir
 */
export async function softDeleteIndividual(id) {
    const now = new Date();
    
    const result = await prisma.$transaction(async (tx) => {
        // Individual kaydını al
        const individual = await tx.individuals.findUnique({
            where: { id: parseInt(id) },
            include: {
                admin: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                }
            }
        });

        // Individual'ı soft delete yap
        const deletedIndividual = await tx.individuals.update({
            where: { id: parseInt(id) },
            data: { 
                deleted_at: now,
                account_status: 'DELETED',
                updated_at: now
            }
        });

        // İlişkili admin'i soft delete yap
        if (individual.admin_id) {
            await tx.admin.update({
                where: { id: individual.admin_id },
                data: { 
                    deleted_at: now,
                    account_status: 'DELETED'
                }
            });
        }

        // İlişkili site'yi soft delete yap (varsa)
        if (individual.site_id) {
            await tx.site.update({
                where: { id: individual.site_id },
                data: { 
                    deleted_at: now,
                    site_status: 'DELETED'
                }
            });
        }

        return {
            id: deletedIndividual.id,
            full_name: individual.admin?.full_name || 'N/A',
            email: individual.admin?.email || 'N/A',
            deleted_at: deletedIndividual.deleted_at
        };
    });

    return result;
}

/**
 * Soft delete edilmiş individual'ı geri yükle
 * İlişkili admin ve site de geri yüklenir
 */
export async function restoreIndividual(id) {
    const result = await prisma.$transaction(async (tx) => {
        // Individual kaydını al
        const individual = await tx.individuals.findUnique({
            where: { id: parseInt(id) },
            include: {
                admin: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                }
            }
        });

        // Individual'ı geri yükle
        const restoredIndividual = await tx.individuals.update({
            where: { id: parseInt(id) },
            data: { 
                deleted_at: null,
                account_status: 'ACTIVE',
                updated_at: new Date()
            }
        });

        // İlişkili admin'i geri yükle
        if (individual.admin_id) {
            await tx.admin.update({
                where: { id: individual.admin_id },
                data: { 
                    deleted_at: null,
                    account_status: 'ACTIVE'
                }
            });
        }

        // İlişkili site'yi geri yükle (varsa)
        if (individual.site_id) {
            await tx.site.update({
                where: { id: individual.site_id },
                data: { 
                    deleted_at: null,
                    site_status: 'ACTIVE'
                }
            });
        }

        return {
            id: restoredIndividual.id,
            full_name: individual.admin?.full_name || 'N/A',
            email: individual.admin?.email || 'N/A',
            account_status: restoredIndividual.account_status
        };
    });

    return result;
}

/**
 * Individual'ı hard delete yap (kalıcı olarak sil)
 * İlişkili admin ve site de kalıcı olarak silinir
 */
export async function hardDeleteIndividual(id) {
    const result = await prisma.$transaction(async (tx) => {
        // Individual kaydını al
        const individual = await tx.individuals.findUnique({
            where: { id: parseInt(id) },
            select: { admin_id: true, site_id: true }
        });

        // İlişkili site'yi kalıcı olarak sil (varsa)
        if (individual.site_id) {
            await tx.site.delete({
                where: { id: individual.site_id }
            });
        }

        // İlişkili admin'i kalıcı olarak sil
        if (individual.admin_id) {
            await tx.admin.delete({
                where: { id: individual.admin_id }
            });
        }

        // Individual'ı kalıcı olarak sil
        const deletedIndividual = await tx.individuals.delete({
            where: { id: parseInt(id) }
        });

        return deletedIndividual;
    });

    return result;
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
                    site_id: true,
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
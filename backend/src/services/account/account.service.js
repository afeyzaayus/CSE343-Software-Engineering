import prisma from '../../prismaClient.js';
import { validateAccountStatus } from '../shared/validation.service.js';

/**
 * Tüm hesapları getir (SUPER_ADMIN için)
 */
export async function getAllAccountsService(filters = {}) {
  const { status, type, search, deleted } = filters;

  const where = {
    ...(deleted !== 'true' && { deleted_at: null }),
    ...(status && { account_status: status }),
    ...(type && { account_type: type }),
    ...(search && {
      OR: [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  const accounts = await prisma.admin.findMany({
    where,
    select: {
      id: true,
      full_name: true,
      email: true,
      account_type: true,
      account_status: true,
      last_login: true,
      created_at: true,
      company_name: true,
      deleted_at: true,
      companies_managed: {
        where: { deleted_at: null },
        select: {
          id: true,
          company_name: true,
          company_code: true,
          account_status: true,
          _count: {
            select: {
              sites: true,
              employees: true
            }
          }
        }
      },
      sites_created: {
        where: { deleted_at: null },
        select: {
          id: true,
          site_name: true,
          site_status: true
        }
      },
      company_employee: {
        include: {
          company: {
            select: {
              company_name: true
            }
          },
          assigned_sites: {
            include: {
              site: {
                select: {
                  site_name: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  return accounts;
}

/**
 * Hesap durumunu güncelle
 */
export async function updateAccountStatusService(adminId, newStatus) {
  validateAccountStatus(newStatus);

  const updateData = {
    account_status: newStatus,
    updated_at: new Date()
  };

  if (newStatus === 'DELETED') {
    updateData.deleted_at = new Date();
  }

  if (newStatus === 'ACTIVE') {
    updateData.deleted_at = null;
  }

  const updatedAdmin = await prisma.admin.update({
    where: { id: adminId },
    data: updateData
  });

  return {
    message: `Hesap durumu ${newStatus} olarak güncellendi.`,
    admin: updatedAdmin
  };
}

/**
 * Dashboard istatistikleri
 */
export async function getDashboardStatsService() {
  const [
    totalAccounts,
    activeAccounts,
    suspendedAccounts,
    totalCompanies,
    totalSites,
    totalMobileUsers
  ] = await Promise.all([
    prisma.admin.count({ where: { deleted_at: null } }),
    prisma.admin.count({ where: { account_status: 'ACTIVE', deleted_at: null } }),
    prisma.admin.count({ where: { account_status: 'SUSPENDED' } }),
    prisma.company.count({ where: { deleted_at: null } }),
    prisma.site.count({ where: { deleted_at: null } }),
    prisma.user.count({ where: { deleted_at: null } })
  ]);

  return {
    totalAccounts,
    activeAccounts,
    suspendedAccounts,
    totalCompanies,
    totalSites,
    totalMobileUsers
  };
}

/**
 * Tek bir hesap detayı getir
 */
export async function getAccountByIdService(adminId) {
  const account = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      full_name: true,
      email: true,
      account_type: true,
      account_status: true,
      company_name: true,
      last_login: true,
      created_at: true,
      deleted_at: true,
      companies_managed: {
        where: { deleted_at: null },
        include: {
          sites: {
            where: { deleted_at: null },
            select: {
              site_id: true,
              site_name: true,
              site_status: true
            }
          },
          employees: {
            include: {
              admin: {
                select: {
                  full_name: true,
                  email: true
                }
              }
            }
          }
        }
      },
      sites_created: {
        where: { deleted_at: null },
        select: {
          site_id: true,
          site_name: true,
          site_status: true
        }
      },
      company_employee: {
        include: {
          company: {
            select: {
              company_name: true,
              company_code: true
            }
          },
          assigned_sites: {
            include: {
              site: {
                select: {
                  site_id: true,
                  site_name: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!account) throw new Error('ACCOUNT_ERROR: Hesap bulunamadı.');

  return account;
}

/**
 * Hesap profilini güncelle
 */
export async function updateAccountProfileService(adminId, updateData) {
  const { full_name, company_name } = updateData;

  const account = await prisma.admin.findUnique({
    where: { id: adminId }
  });

  if (!account) throw new Error('ACCOUNT_ERROR: Hesap bulunamadı.');

  const updatedAccount = await prisma.admin.update({
    where: { id: adminId },
    data: {
      full_name: full_name || account.full_name,
      company_name: company_name || account.company_name,
      updated_at: new Date()
    },
    select: {
      id: true,
      full_name: true,
      email: true,
      account_type: true,
      company_name: true
    }
  });

  return {
    message: 'Profil başarıyla güncellendi.',
    account: updatedAccount
  };
}
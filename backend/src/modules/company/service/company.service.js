import prisma from '../../../prisma/prismaClient.js';

/**
 * Şirket yöneticisinin şirket bilgilerini getir
 */
export async function getCompanyByManagerService(managerId) {
  const manager = await prisma.admin.findUnique({
    where: { id: managerId },
    include: {
      companies_managed: {
        where: { deleted_at: null },
        include: {
          sites: {
            where: { deleted_at: null },
            select: {
              id: true,
              site_id: true,
              site_name: true,
              site_status: true
            }
          },
          employees: {
            include: {
              admin: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                  account_status: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!manager) throw new Error('AUTH_ERROR: Yönetici bulunamadı.');
  if (manager.account_type !== 'COMPANY_MANAGER') {
    throw new Error('AUTH_ERROR: Bu işlem sadece şirket yöneticileri tarafından yapılabilir.');
  }

  const company = manager.companies_managed[0];
  if (!company) throw new Error('COMPANY_ERROR: Şirket bulunamadı.');

  return company;
}

/**
 * Şirket bilgilerini güncelle
 */
export async function updateCompanyService(managerId, updateData) {
  const { company_name, company_address } = updateData;

  const manager = await prisma.admin.findUnique({
    where: { id: managerId },
    include: {
      companies_managed: {
        where: { deleted_at: null }
      }
    }
  });

  if (!manager) throw new Error('AUTH_ERROR: Yönetici bulunamadı.');
  if (manager.account_type !== 'COMPANY_MANAGER') {
    throw new Error('AUTH_ERROR: Bu işlem sadece şirket yöneticileri tarafından yapılabilir.');
  }

  const company = manager.companies_managed[0];
  if (!company) throw new Error('COMPANY_ERROR: Şirket bulunamadı.');

  const updatedCompany = await prisma.company.update({
    where: { id: company.id },
    data: {
      company_name: company_name || company.company_name,
      company_address: company_address || company.company_address,
      updated_at: new Date()
    }
  });

  return {
    message: 'Şirket bilgileri başarıyla güncellendi.',
    company: updatedCompany
  };
}

/**
 * Şirket çalışanlarını listele
 */
export async function getCompanyEmployeesService(managerId) {
  const manager = await prisma.admin.findUnique({
    where: { id: managerId },
    include: {
      companies_managed: {
        where: { deleted_at: null }
      }
    }
  });

  if (!manager) throw new Error('AUTH_ERROR: Yönetici bulunamadı.');
  if (manager.account_type !== 'COMPANY_MANAGER') {
    throw new Error('AUTH_ERROR: Bu işlem sadece şirket yöneticileri tarafından yapılabilir.');
  }

  const company = manager.companies_managed[0];
  if (!company) throw new Error('COMPANY_ERROR: Şirket bulunamadı.');

  const employees = await prisma.companyEmployee.findMany({
    where: {
      company_id: company.id,
      status: 'ACTIVE'
    },
    include: {
      admin: {
        select: {
          id: true,
          full_name: true,
          email: true,
          account_status: true,
          last_login: true,
          created_at: true
        }
      },
      assigned_sites: {
        include: {
          site: {
            select: {
              site_id: true,
              site_name: true,
              site_status: true
            }
          }
        }
      }
    }
  });

  return employees;
}
import prisma from '../../../prisma/prismaClient.js';

/**
 * Şirket yöneticisinin şirket bilgilerini getir
 * managerId = admin.id (yönetici)
 */
export async function getCompanyByManagerService(managerId) {
  // Manager (admin) bulunur ve companyId'si kullanılarak companies tablosundan şirket getirilir.
  const manager = await prisma.admin.findUnique({
    where: { id: managerId },
    select: {
      id: true,
      full_name: true,
      email: true,
      account_type: true,
      companyId: true
    }
  });

  if (!manager) throw new Error('AUTH_ERROR: Yönetici bulunamadı.');
  if (manager.account_type !== 'COMPANY_MANAGER') {
    throw new Error('AUTH_ERROR: Bu işlem sadece şirket yöneticileri tarafından yapılabilir.');
  }
  if (!manager.companyId) throw new Error('COMPANY_ERROR: Yöneticiye bağlı şirket bilgisi bulunamadı.');

  const company = await prisma.companies.findUnique({
    where: { id: manager.companyId },
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
      // company_employees ile birlikte admins bilgilerini getir
      company_employees: {
        include: {
          admins: {
            select: {
              id: true,
              full_name: true,
              email: true,
              account_status: true
            }
          }
        },
        where: { status: { not: 'DELETED' } } // opsiyonel: silinmişleri at
      }
    }
  });

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
    select: { id: true, account_type: true, companyId: true }
  });

  if (!manager) throw new Error('AUTH_ERROR: Yönetici bulunamadı.');
  if (manager.account_type !== 'COMPANY_MANAGER') {
    throw new Error('AUTH_ERROR: Bu işlem sadece şirket yöneticileri tarafından yapılabilir.');
  }
  if (!manager.companyId) throw new Error('COMPANY_ERROR: Şirket bilgisi bulunamadı.');

  const updatedCompany = await prisma.companies.update({
    where: { id: manager.companyId },
    data: {
      // Eğer alan gelmemişse mevcut değeri koru
      company_name: company_name ?? undefined,
      // company_address alanı schema'da yoksa bu satırı kaldır; yoksa kullan
      // company_address: company_address ?? undefined,
      updated_at: new Date()
    }
  });

  return {
    message: 'Şirket bilgileri başarıyla güncellendi.',
    company: updatedCompany
  };
}

/**
 * Şirket çalışanlarını getir
 */
export async function getCompanyEmployeesService(adminId) {
  try {
    console.log('🔍 SERVICE BAŞLADI - adminId:', adminId);

    // Admin'i al
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        account_type: true,
        companyId: true
      }
    });

    if (!admin) {
      throw new Error('AUTH_ERROR: Admin bulunamadı.');
    }

    console.log('✅ Admin bulundu:', {
      id: admin.id,
      email: admin.email,
      account_type: admin.account_type,
      companyId: admin.companyId
    });

    if (admin.account_type !== 'COMPANY_MANAGER') {
      throw new Error('AUTH_ERROR: Bu işlem sadece şirket yöneticileri için geçerlidir.');
    }

    if (!admin.companyId) {
      throw new Error('COMPANY_ERROR: Şirket bilgisi bulunamadı.');
    }

    console.log('🔍 Çalışanlar aranıyor, company_id:', admin.companyId);

    // Şirket var mı kontrolü
    const company = await prisma.companies.findUnique({
      where: { id: admin.companyId },
      select: { id: true, company_name: true }
    });
    if (!company) throw new Error('COMPANY_ERROR: Şirket bulunamadı.');

    console.log('✅ Şirket bulundu:', company.company_name);

    // Raw employees (ekstra kontrol/diagnostic amaçlı)
    const employeesRaw = await prisma.company_employees.findMany({
      where: {
        company_id: admin.companyId,
        deleted_at: null  // Soft delete edilmiş çalışanları hariç tut
      }
    });
    console.log(`✅ ${employeesRaw.length} çalışan bulundu (raw)`);

    // Try relation include (schema'ya göre company_employees.admins var)
    console.log('🔍 Step 2: Employees with relation...');
    let employees;
    try {
      employees = await prisma.company_employees.findMany({
        where: {
          company_id: admin.companyId,
          deleted_at: null  // Soft delete edilmiş çalışanları hariç tut
        },
        include: {
          admins: {
            select: {
              id: true,
              full_name: true,
              email: true,
              account_status: true,
              last_login: true
            }
          },
          employee_site_access: {
            include: {
              sites: {
                select: {
                  id: true,
                  site_id: true,
                  site_name: true
                }
              }
            }
          }
        }
      });
      console.log(`✅ ${employees.length} çalışan bulundu (with relation)`);
    } catch (relationError) {
      // Eğer ilişkide isim karışıklığı varsa manuel join yap
      console.error('❌ İlişki hatası:', relationError.message);
      employees = await Promise.all(
        employeesRaw.map(async (emp) => {
          const adminData = await prisma.admin.findUnique({
            where: { id: emp.admin_id },
            select: {
              id: true,
              full_name: true,
              email: true,
              account_status: true,
              last_login: true
            }
          });

          const access = await prisma.employee_site_access.findMany({
            where: { employee_id: emp.id },
            include: {
              sites: {
                select: {
                  id: true,
                  site_id: true,
                  site_name: true
                }
              }
            }
          });

          return { ...emp, admins: adminData, employee_site_access: access };
        })
      );
      console.log('✅ Manuel join tamamlandı');
    }

    const formattedEmployees = employees.map(emp => ({
      id: emp.id,
      admin_id: emp.admin_id,
      full_name: emp.admins?.full_name || 'Bilinmeyen',
      email: emp.admins?.email || 'Email yok',
      status: emp.status,
      joined_at: emp.joined_at,
      account_status: emp.admins?.account_status || 'UNKNOWN',
      last_login: emp.admins?.last_login || null,
      assigned_sites: (emp.employee_site_access || []).map(a => ({
        id: a.sites?.id,
        site_id: a.sites?.site_id,
        site_name: a.sites?.site_name,
        granted_at: a.granted_at
      }))
    }));

    console.log('✅ SERVICE TAMAMLANDI');

    return {
      company,
      employees: formattedEmployees,
      total: formattedEmployees.length
    };

  } catch (error) {
    console.error('❌ SERVICE HATASI:', error);
    console.error('❌ Hata Tipi:', error.constructor?.name);
    console.error('❌ Hata Mesajı:', error.message);
    console.error('❌ Stack:', error.stack);
    throw error;
  }
}

/**
 * Çalışanı askıya al (SUSPEND)
 */
export async function suspendEmployeeService(managerId, employeeId) {
  try {
    // Yönetici kontrolü
    const manager = await prisma.admin.findUnique({
      where: { id: managerId },
      include: { company: true } // admin.company relation schema'da mevcut
    });

    if (!manager) throw new Error('AUTH_ERROR: Yönetici bulunamadı');
    if (manager.account_type !== 'COMPANY_MANAGER') {
      throw new Error('AUTH_ERROR: Bu işlem sadece şirket yöneticileri tarafından yapılabilir');
    }
    if (!manager.companyId) throw new Error('COMPANY_ERROR: Şirket bilgisi bulunamadı');

    // Çalışanı bul ve şirkete ait olduğunu kontrol et
    const employee = await prisma.company_employees.findFirst({
      where: { id: employeeId, company_id: manager.companyId },
      include: { admins: true }
    });

    if (!employee) throw new Error('EMPLOYEE_ERROR: Çalışan bulunamadı veya yetkiniz yok');
    if (employee.status === 'SUSPENDED') throw new Error('EMPLOYEE_ERROR: Çalışan zaten askıya alınmış');
    if (employee.status === 'DELETED') throw new Error('EMPLOYEE_ERROR: Silinmiş çalışan askıya alınamaz');

    const result = await prisma.$transaction(async (tx) => {
      const updatedEmployee = await tx.company_employees.update({
        where: { id: employeeId },
        data: { status: 'SUSPENDED' }
      });

      await tx.admin.update({
        where: { id: employee.admin_id },
        data: { account_status: 'SUSPENDED' }
      });

      return updatedEmployee;
    });

    console.log('✅ Çalışan askıya alındı:', {
      employee_id: employeeId,
      admin_id: employee.admin_id,
      email: employee.admins?.email
    });

    return {
      message: 'Çalışan başarıyla askıya alındı',
      employee: {
        id: result.id,
        admin_id: result.admin_id,
        status: result.status,
        full_name: employee.admins?.full_name || null,
        email: employee.admins?.email || null
      }
    };

  } catch (error) {
    console.error('❌ suspendEmployeeService hatası:', error);
    throw error;
  }
}

/**
 * Çalışanı aktif et (ACTIVATE)
 */
export async function activateEmployeeService(managerId, employeeId) {
  try {
    const manager = await prisma.admin.findUnique({
      where: { id: managerId },
      include: { company: true }
    });

    if (!manager) throw new Error('AUTH_ERROR: Yönetici bulunamadı');
    if (manager.account_type !== 'COMPANY_MANAGER') {
      throw new Error('AUTH_ERROR: Bu işlem sadece şirket yöneticileri tarafından yapılabilir');
    }
    if (!manager.companyId) throw new Error('COMPANY_ERROR: Şirket bilgisi bulunamadı');

    const employee = await prisma.company_employees.findFirst({
      where: { id: employeeId, company_id: manager.companyId },
      include: { admins: true }
    });

    if (!employee) throw new Error('EMPLOYEE_ERROR: Çalışan bulunamadı veya yetkiniz yok');
    if (employee.status === 'ACTIVE') throw new Error('EMPLOYEE_ERROR: Çalışan zaten aktif');
    if (employee.status === 'DELETED') throw new Error('EMPLOYEE_ERROR: Silinmiş çalışan aktif edilemez');

    const result = await prisma.$transaction(async (tx) => {
      const updatedEmployee = await tx.company_employees.update({
        where: { id: employeeId },
        data: { status: 'ACTIVE' }
      });

      await tx.admin.update({
        where: { id: employee.admin_id },
        data: { account_status: 'ACTIVE' }
      });

      return updatedEmployee;
    });

    console.log('✅ Çalışan aktif edildi:', {
      employee_id: employeeId,
      admin_id: employee.admin_id,
      email: employee.admins?.email
    });

    return {
      message: 'Çalışan başarıyla aktif edildi',
      employee: {
        id: result.id,
        admin_id: result.admin_id,
        status: result.status,
        full_name: employee.admins?.full_name || null,
        email: employee.admins?.email || null
      }
    };

  } catch (error) {
    console.error('❌ activateEmployeeService hatası:', error);
    throw error;
  }
}

export async function deleteEmployeeService(managerId, employeeId) {
  try {
    const manager = await prisma.admin.findUnique({
      where: { id: managerId },
      include: { company: true }
    });

    if (!manager) throw new Error('AUTH_ERROR: Yönetici bulunamadı');
    if (manager.account_type !== 'COMPANY_MANAGER') {
      throw new Error('AUTH_ERROR: Bu işlem sadece şirket yöneticileri tarafından yapılabilir');
    }
    if (!manager.companyId) throw new Error('COMPANY_ERROR: Şirket bilgisi bulunamadı');

    // Çalışanı bul
    const employee = await prisma.company_employees.findFirst({
      where: { id: employeeId, company_id: manager.companyId },
      include: { admins: true, employee_site_access: true }
    });

    if (!employee) throw new Error('EMPLOYEE_ERROR: Çalışan bulunamadı veya yetkiniz yok');

    const adminId = employee.admin_id;
    const now = new Date();

    // 🔄 SOFT DELETE — deleted_at güncelleme
    await prisma.$transaction(async (tx) => {

      // 1) Site erişimlerini soft delete yap
      await tx.employee_site_access.updateMany({
        where: { employee_id: employeeId },
        data: { deleted_at: now }
      });

      // 2) Şirket çalışanı tablosunda soft delete yap
      await tx.company_employees.update({
        where: { id: employeeId },
        data: {
          deleted_at: now,
          status: 'DELETED'
        }
      });

      // 3) Admin tablosunda soft delete yap
      await tx.admin.update({
        where: { id: adminId },
        data: {
          deleted_at: now,
          account_status: 'DELETED'
        }
      });

    });

    console.log(`✅ Çalışan soft delete yapıldı: employeeId=${employeeId}, adminId=${adminId}`);

    return {
      message: 'Çalışan başarıyla silindi (soft delete)',
      employee: {
        id: employeeId,
        admin_id: adminId,
        full_name: employee.admins?.full_name || null,
        email: employee.admins?.email || null,
        removed_site_access: employee.employee_site_access?.length || 0
      }
    };

  } catch (error) {
    console.error('❌ deleteEmployeeService HATA:', error);
    throw error;
  }
}

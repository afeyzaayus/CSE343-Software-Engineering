import prisma from '../../prisma/prismaClient.js';
import { validateSiteId } from '../../shared/validation.service.js';

export async function createSiteService(adminId, siteData) {
  const { site_id, site_name, site_address } = siteData;

  validateSiteId(site_id, 4);

  const existingSite = await prisma.site.findUnique({ where: { site_id } });
  if (existingSite) throw new Error('SITE_ERROR: Bu Site ID zaten kullanılıyor.');

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: {
      sites_created: { where: { deleted_at: null } },
      company: true,
      company_employees: true,
      individual: true  // ✅ Individual ilişkisini ekle
    }
  });

  if (!admin) throw new Error('AUTH_ERROR: Admin bulunamadı.');
  if (admin.deleted_at) throw new Error('AUTH_ERROR: Hesabınız silinmiş.');
  if (admin.account_status !== 'ACTIVE') throw new Error('AUTH_ERROR: Hesabınız aktif değil.');

  let companyId = null;

  if (admin.account_type === 'COMPANY_MANAGER') {
    if (!admin.company) throw new Error('COMPANY_ERROR: Şirket bulunamadı.');
    companyId = admin.company.id;
  }

  // ✅ Transaction ile site oluştur ve individual'ı güncelle
  const result = await prisma.$transaction(async (tx) => {
    const newSite = await tx.site.create({
      data: {
        site_id,
        site_name,
        site_address,
        site_status: 'ACTIVE',
        adminId: admin.id,
        company_id: companyId
      }
    });

    // ✅ Eğer INDIVIDUAL ise, individuals tablosunu güncelle
    if (admin.account_type === 'INDIVIDUAL' && admin.individual) {
      await tx.individuals.update({
        where: { id: admin.individual.id },
        data: { site_id: newSite.id }
      });
    }

    return newSite;
  });

  return {
    message: 'Site başarıyla oluşturuldu.',
    site: result
  };
}
/**
 * Site listesi getir (Admin'e göre filtreleme)
 */
export async function getSitesService(adminId, filters) {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: {
      company: true
    }
  });

  if (!admin) throw new Error("AUTH_ERROR: Admin bulunamadı.");
  if (admin.deleted_at) throw new Error('AUTH_ERROR: Hesabınız silinmiş.');
  if (admin.account_status !== 'ACTIVE') throw new Error('AUTH_ERROR: Hesabınız aktif değil.');

  let sites = [];

  // 1. INDIVIDUAL → sadece kendi oluşturdukları
  if (admin.account_type === "INDIVIDUAL") {
    sites = await prisma.site.findMany({
      where: {
        adminId: admin.id,
        deleted_at: null
      },
      include: {
        admin: {
          select: {
            full_name: true,
            email: true
          }
        },
        _count: {
          select: {
            blocks: true,
            users: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  // 2. COMPANY_MANAGER → şirketine bağlı tüm siteler
  else if (admin.account_type === "COMPANY_MANAGER") {
    if (!admin.companyId) {
      throw new Error("COMPANY_ERROR: Admin bir şirkete bağlı değil.");
    }

    sites = await prisma.site.findMany({
      where: {
        company_id: admin.companyId,
        deleted_at: null
      },
      include: {
        admin: {
          select: {
            full_name: true,
            email: true
          }
        },
        companies: {
          select: {
            company_name: true,
            company_code: true
          }
        },
        _count: {
          select: {
            blocks: true,
            users: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  // 3. COMPANY_EMPLOYEE → şirketine bağlı tüm siteler
  else if (admin.account_type === "COMPANY_EMPLOYEE") {
    console.log('🔍 COMPANY_EMPLOYEE için site listesi alınıyor...');
    
    let companyIdToUse = null;

    // ÖNCE: Admin tablosunda companyId var mı kontrol et
    if (admin.companyId) {
      console.log('✅ Admin.companyId bulundu:', admin.companyId);
      companyIdToUse = admin.companyId;
    } 
    // Yoksa: company_employees tablosundan şirket ID'sini al
    else {
      console.log('⚠️ Admin.companyId yok, company_employees tablosundan aranıyor...');
      
      // ✅ ÇÖZÜM: Her ihtimali dene
      let employeeRecord = null;
      
      try {
        // İlk deneme: company_employees (snake_case - veritabanı adı)
        if (prisma.company_employees) {
          console.log('🧪 Deneme 1: prisma.company_employees');
          employeeRecord = await prisma.company_employees.findFirst({
            where: {
              admin_id: admin.id,
              deleted_at: null
            }
          });
        }
      } catch (err) {
        console.log('❌ company_employees çalışmadı:', err.message);
      }

      if (!employeeRecord) {
        try {
          // İkinci deneme: companyEmployee (camelCase tekil)
          if (prisma.companyEmployee) {
            console.log('🧪 Deneme 2: prisma.companyEmployee');
            employeeRecord = await prisma.companyEmployee.findFirst({
              where: {
                admin_id: admin.id,
                deleted_at: null
              }
            });
          }
        } catch (err) {
          console.log('❌ companyEmployee çalışmadı:', err.message);
        }
      }

      if (!employeeRecord) {
        try {
          // Üçüncü deneme: companyEmployees (camelCase çoğul)
          if (prisma.companyEmployees) {
            console.log('🧪 Deneme 3: prisma.companyEmployees');
            employeeRecord = await prisma.companyEmployees.findFirst({
              where: {
                admin_id: admin.id,
                deleted_at: null
              }
            });
          }
        } catch (err) {
          console.log('❌ companyEmployees çalışmadı:', err.message);
        }
      }

      if (!employeeRecord) {
        // Tüm Prisma modellerini logla
        const allModels = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
        console.log('❌ Hiçbir model çalışmadı! Mevcut modeller:', allModels);
        
        throw new Error("AUTH_ERROR: Çalışan kaydı bulunamadı. Sistem yapılandırması hatalı.");
      }

      companyIdToUse = employeeRecord.company_id;
      console.log('✅ Çalışan kaydı bulundu, company_id:', companyIdToUse);
    }

    // Şirkete ait siteleri getir
    sites = await prisma.site.findMany({
      where: {
        company_id: companyIdToUse,
        deleted_at: null
      },
      include: {
        admin: {
          select: {
            full_name: true,
            email: true
          }
        },
        companies: {
          select: {
            company_name: true,
            company_code: true
          }
        },
        _count: {
          select: {
            blocks: true,
            users: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  // 4. SUPER_ADMIN → Tüm siteler
  else if (admin.account_type === "SUPER_ADMIN") {
    sites = await prisma.site.findMany({
      where: { deleted_at: null },
      include: {
        admin: {
          select: {
            full_name: true,
            email: true
          }
        },
        companies: {
          select: {
            company_name: true,
            company_code: true
          }
        },
        _count: {
          select: {
            blocks: true,
            users: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  // Filtreleme
  if (filters.status) {
    sites = sites.filter(s => s.site_status === filters.status);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    sites = sites.filter(s =>
      s.site_name.toLowerCase().includes(q) ||
      s.site_id.toLowerCase().includes(q) ||
      (s.site_address && s.site_address.toLowerCase().includes(q))
    );
  }

  return sites;
}

/**
 * Site güncelleme
 */
export async function updateSiteService(adminId, site_id, updateData) {
  const { site_name, site_address } = updateData;

  const site = await prisma.site.findUnique({
    where: { site_id }
  });

  if (!site) throw new Error('SITE_ERROR: Site bulunamadı.');
  if (site.deleted_at) throw new Error('SITE_ERROR: Bu site silinmiş.');

  const admin = await prisma.admin.findUnique({ 
    where: { id: adminId },
    include: {
      company: true
    }
  });

  if (!admin) throw new Error('AUTH_ERROR: Admin bulunamadı.');

  if (admin.account_type === 'COMPANY_EMPLOYEE') {
    throw new Error('AUTH_ERROR: Şirket çalışanları site düzenleyemez.');
  }

  if (admin.account_type === 'INDIVIDUAL' && site.adminId !== adminId) {
    throw new Error('AUTH_ERROR: Bu siteyi güncelleme yetkiniz yok.');
  }

  if (admin.account_type === 'COMPANY_MANAGER') {
    if (!admin.companyId || site.company_id !== admin.companyId) {
      throw new Error('AUTH_ERROR: Bu siteyi güncelleme yetkiniz yok.');
    }
  }

  await prisma.site.update({
    where: { site_id },
    data: {
      site_name: site_name || site.site_name,
      site_address: site_address || site.site_address,
      updated_at: new Date()
    }
  });

  return { message: 'Site başarıyla güncellendi.' };
}

/**
 * Site silme (soft delete)
 */
export async function deleteSiteService(adminId, site_id) {
  const site = await prisma.site.findUnique({
    where: { site_id }
  });

  if (!site) throw new Error('SITE_ERROR: Site bulunamadı.');
  if (site.deleted_at) throw new Error('SITE_ERROR: Bu site zaten silinmiş.');

  const admin = await prisma.admin.findUnique({ 
    where: { id: adminId },
    include: {
      company: true
    }
  });

  if (!admin) throw new Error('AUTH_ERROR: Admin bulunamadı.');

  if (admin.account_type === 'COMPANY_EMPLOYEE') {
    throw new Error('AUTH_ERROR: Şirket çalışanları site silemez.');
  }

  if (admin.account_type === 'INDIVIDUAL' && site.adminId !== adminId) {
    throw new Error('AUTH_ERROR: Bu siteyi silme yetkiniz yok.');
  }

  if (admin.account_type === 'COMPANY_MANAGER') {
    if (!admin.companyId || site.company_id !== admin.companyId) {
      throw new Error('AUTH_ERROR: Bu siteyi silme yetkiniz yok.');
    }
  }

  await prisma.site.update({
    where: { site_id },
    data: {
      deleted_at: new Date(),
      site_status: 'DELETED'  // ✅ Eklendi
    }
  });

  return { message: 'Site başarıyla silindi.' };
}
/**
 * Tek bir site detayı getir
 */
export async function getSiteByIdService(adminId, site_id) {
  const site = await prisma.site.findUnique({
    where: { site_id },
    include: {
      admin: {
        select: {
          full_name: true,
          email: true,
          account_type: true
        }
      },
      companies: {
        select: {
          company_name: true,
          company_code: true
        }
      },
      blocks: {
        where: { deleted_at: null },
        orderBy: { block_name: 'asc' },
        include: {
          _count: {
            select: {
              users: true
            }
          }
        }
      },
      users: {
        where: { deleted_at: null },
        select: {
          id: true,
          full_name: true,
          phone_number: true,
          block_no: true,
          apartment_no: true,
          account_status: true
        },
        orderBy: [
          { block_no: 'asc' },
          { apartment_no: 'asc' }
        ]
      }
    }
  });

  if (!site) throw new Error('SITE_ERROR: Site bulunamadı.');
  if (site.deleted_at) throw new Error('SITE_ERROR: Bu site silinmiş.');

  const admin = await prisma.admin.findUnique({ 
    where: { id: adminId },
    include: {
      company: true
    }
  });

  if (!admin) throw new Error('AUTH_ERROR: Admin bulunamadı.');

  if (admin.account_type === 'INDIVIDUAL' && site.adminId !== adminId) {
    throw new Error('AUTH_ERROR: Bu siteyi görüntüleme yetkiniz yok.');
  }

  if (admin.account_type === 'COMPANY_MANAGER' || admin.account_type === 'COMPANY_EMPLOYEE') {
    let companyId = admin.companyId;

    if (admin.account_type === 'COMPANY_EMPLOYEE' && !companyId) {
      // Aynı fallback mantığı
      let employeeRecord = null;
      
      if (prisma.company_employees) {
        try {
          employeeRecord = await prisma.company_employees.findFirst({
            where: { admin_id: admin.id, deleted_at: null }
          });
        } catch (err) {}
      }
      
      if (!employeeRecord && prisma.companyEmployee) {
        try {
          employeeRecord = await prisma.companyEmployee.findFirst({
            where: { admin_id: admin.id, deleted_at: null }
          });
        } catch (err) {}
      }
      
      if (!employeeRecord && prisma.companyEmployees) {
        try {
          employeeRecord = await prisma.companyEmployees.findFirst({
            where: { admin_id: admin.id, deleted_at: null }
          });
        } catch (err) {}
      }

      if (!employeeRecord) {
        throw new Error('AUTH_ERROR: Çalışan kaydı bulunamadı.');
      }

      companyId = employeeRecord.company_id;
    }

    if (!companyId || site.company_id !== companyId) {
      throw new Error('AUTH_ERROR: Bu siteyi görüntüleme yetkiniz yok.');
    }
  }

  return site;
}
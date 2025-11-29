import prisma from '../../../prisma/prismaClient.js';
import { validateSiteId } from '../../../shared/validation.service.js';
import { createBlocksForSite, recreateBlocksForSite } from './block.service.js';

/**
 * Site oluşturma
 * site_id frontend'den gelecek
 * block_count varsa otomatik bloklar oluşturulacak
 */
export async function createSiteService(adminId, siteData) {
  const { site_id, site_name, site_address, block_count, apartment_count } = siteData;

  // site_id validasyonu
  validateSiteId(site_id, 4);

  // Site ID çakışması kontrolü
  const existingSite = await prisma.site.findUnique({ where: { site_id } });
  if (existingSite) throw new Error('SITE_ERROR: Bu Site ID zaten kullanılıyor.');

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: {
      sites_created: { where: { deleted_at: null } },
      company: true,
      company_employees: true
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

  // Transaction ile Site ve Blokları birlikte oluştur
  const result = await prisma.$transaction(async (tx) => {
    // Yeni site oluştur
    const newSite = await tx.site.create({
      data: {
        site_id,
        site_name,
        site_address,
        block_count: block_count || null,
        apartment_count: apartment_count || null,
        site_status: 'ACTIVE',
        adminId: admin.id,
        company_id: companyId  // ← Site modelinde company_id (snake_case)
      }
    });

    // Eğer block_count varsa blokları otomatik oluştur
    const blocks = await createBlocksForSite(newSite.id, block_count, tx);

    return { newSite, blocks };
  });

  return {
    message: 'Site başarıyla oluşturuldu.',
    site: result.newSite,
    blocks: result.blocks,
    blockCount: result.blocks.length
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
        company_id: admin.companyId,  // ← Admin'den companyId, Site'de company_id
        deleted_at: null
      },
      include: {
        admin: {
          select: {
            full_name: true,
            email: true
          }
        },
        companies: {  // ← Site modelinde relation adı 'companies'
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
    const employeeRecord = await prisma.company_employee.findFirst({
      where: {
        admin_id: admin.id,
        deleted_at: null
      },
      include: {
        company: true
      }
    });

    if (!employeeRecord) {
      throw new Error("AUTH_ERROR: Çalışan kaydı bulunamadı.");
    }

    sites = await prisma.site.findMany({
      where: {
        company_id: employeeRecord.company_id,
        deleted_at: null
      },
      include: {
        admin: {
          select: {
            full_name: true,
            email: true
          }
        },
        companies: {  // ← Site modelinde relation adı 'companies'
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
        companies: {  // ← Site modelinde relation adı 'companies'
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
 * Site güncelleme (blok sayısı değişirse blokları yeniden oluştur)
 */
export async function updateSiteService(adminId, site_id, updateData) {
  const { site_name, site_address, block_count, apartment_count } = updateData;

  const site = await prisma.site.findUnique({
    where: { site_id },
    include: {
      blocks: { where: { deleted_at: null } }
    }
  });

  if (!site) throw new Error('SITE_ERROR: Site bulunamadı.');
  if (site.deleted_at) throw new Error('SITE_ERROR: Bu site silinmiş.');

  // Yetki kontrolü
  const admin = await prisma.admin.findUnique({ 
    where: { id: adminId },
    include: {
      company: true
    }
  });

  if (!admin) throw new Error('AUTH_ERROR: Admin bulunamadı.');

  // COMPANY_EMPLOYEE düzenleyemez
  if (admin.account_type === 'COMPANY_EMPLOYEE') {
    throw new Error('AUTH_ERROR: Şirket çalışanları site düzenleyemez.');
  }

  // INDIVIDUAL sadece kendi sitelerini düzenleyebilir
  if (admin.account_type === 'INDIVIDUAL' && site.adminId !== adminId) {
    throw new Error('AUTH_ERROR: Bu siteyi güncelleme yetkiniz yok.');
  }

  // COMPANY_MANAGER sadece şirketinin sitelerini düzenleyebilir
  if (admin.account_type === 'COMPANY_MANAGER') {
    if (!admin.companyId || site.company_id !== admin.companyId) {
      throw new Error('AUTH_ERROR: Bu siteyi güncelleme yetkiniz yok.');
    }
  }

  // SUPER_ADMIN her şeyi düzenleyebilir

  await prisma.$transaction(async (tx) => {
    // Site bilgilerini güncelle
    await tx.site.update({
      where: { site_id },
      data: {
        site_name: site_name || site.site_name,
        site_address: site_address || site.site_address,
        block_count: block_count !== undefined ? block_count : site.block_count,
        apartment_count: apartment_count !== undefined ? apartment_count : site.apartment_count,
        updated_at: new Date()
      }
    });

    // Eğer block_count değiştiyse blokları yeniden oluştur
    if (block_count !== undefined && block_count !== site.block_count) {
      await recreateBlocksForSite(site_id, block_count, tx);
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

  // Yetki kontrolü
  const admin = await prisma.admin.findUnique({ 
    where: { id: adminId },
    include: {
      company: true
    }
  });

  if (!admin) throw new Error('AUTH_ERROR: Admin bulunamadı.');

  // COMPANY_EMPLOYEE silemez
  if (admin.account_type === 'COMPANY_EMPLOYEE') {
    throw new Error('AUTH_ERROR: Şirket çalışanları site silemez.');
  }

  // INDIVIDUAL sadece kendi sitelerini silebilir
  if (admin.account_type === 'INDIVIDUAL' && site.adminId !== adminId) {
    throw new Error('AUTH_ERROR: Bu siteyi silme yetkiniz yok.');
  }

  // COMPANY_MANAGER sadece şirketinin sitelerini silebilir
  if (admin.account_type === 'COMPANY_MANAGER') {
    if (!admin.companyId || site.company_id !== admin.companyId) {
      throw new Error('AUTH_ERROR: Bu siteyi silme yetkiniz yok.');
    }
  }

  // SUPER_ADMIN her şeyi silebilir

  await prisma.site.update({
    where: { site_id },
    data: {
      deleted_at: new Date()
    }
  });

  return { message: 'Site başarıyla silindi.' };
}

/**
 * Tek bir site detayı getir (bloklar, kullanıcılar dahil)
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
      companies: {  // ← Site modelinde relation adı 'companies'
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

  // Yetki kontrolü
  const admin = await prisma.admin.findUnique({ 
    where: { id: adminId },
    include: {
      company: true
    }
  });

  if (!admin) throw new Error('AUTH_ERROR: Admin bulunamadı.');

  // INDIVIDUAL sadece kendi sitelerini görebilir
  if (admin.account_type === 'INDIVIDUAL' && site.adminId !== adminId) {
    throw new Error('AUTH_ERROR: Bu siteyi görüntüleme yetkiniz yok.');
  }

  // COMPANY_MANAGER ve COMPANY_EMPLOYEE şirketlerinin sitelerini görebilir
  if (admin.account_type === 'COMPANY_MANAGER' || admin.account_type === 'COMPANY_EMPLOYEE') {
    let companyId = admin.companyId;

    // COMPANY_EMPLOYEE ise company_employee tablosundan şirket ID'sini al
    if (admin.account_type === 'COMPANY_EMPLOYEE') {
      const employeeRecord = await prisma.company_employee.findFirst({
        where: {
          admin_id: admin.id,
          deleted_at: null
        }
      });

      if (!employeeRecord) {
        throw new Error('AUTH_ERROR: Çalışan kaydı bulunamadı.');
      }

      companyId = employeeRecord.company_id;
    }

    if (!companyId || site.company_id !== companyId) {
      throw new Error('AUTH_ERROR: Bu siteyi görüntüleme yetkiniz yok.');
    }
  }

  // SUPER_ADMIN her şeyi görebilir

  return site;
}
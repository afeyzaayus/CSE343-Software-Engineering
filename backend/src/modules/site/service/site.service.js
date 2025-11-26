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

  // Admin kontrolü
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: {
      sites_created: {
        where: { deleted_at: null }
      },
      companies_managed: {
        where: { deleted_at: null }
      }
    }
  });

  if (!admin) throw new Error('AUTH_ERROR: Admin bulunamadı.');
  if (admin.deleted_at) throw new Error('AUTH_ERROR: Hesabınız silinmiş.');
  if (admin.account_status !== 'ACTIVE') throw new Error('AUTH_ERROR: Hesabınız aktif değil.');

  let company = null;
  let companyId = null;

  // COMPANY_MANAGER ise şirkete bağla
  if (admin.account_type === 'COMPANY_MANAGER') {
    company = admin.companies_managed[0];
    if (!company) throw new Error('COMPANY_ERROR: Şirket bulunamadı.');
    companyId = company.id;
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
        company_id: companyId
      }
    });

    // Eğer block_count varsa blokları otomatik oluştur
    const blocks = await createBlocksForSite(site_id, block_count, tx);

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

  // Yetki kontrolü
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (site.adminId !== adminId && admin.account_type !== 'SUPER_ADMIN') {
    throw new Error('AUTH_ERROR: Bu siteyi güncelleme yetkiniz yok.');
  }

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
 * Site listesi getir (Admin'e göre filtreleme)
 */
export async function getSitesService(adminId, filters = {}) {
  const { status, search } = filters;

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: {
      companies_managed: {
        where: { deleted_at: null }
      }
    }
  });

  if (!admin) throw new Error('AUTH_ERROR: Admin bulunamadı.');

  let where = { deleted_at: null };

  // COMPANY_MANAGER sadece kendi şirketinin sitelerini görebilir
  if (admin.account_type === 'COMPANY_MANAGER') {
    const company = admin.companies_managed[0];
    if (!company) throw new Error('COMPANY_ERROR: Şirket bulunamadı.');
    where.company_id = company.id;
  }
  // INDIVIDUAL sadece kendi oluşturduğu siteleri görebilir
  else if (admin.account_type === 'INDIVIDUAL') {
    where.adminId = adminId;
  }
  // COMPANY_EMPLOYEE atandığı siteleri görebilir
  else if (admin.account_type === 'COMPANY_EMPLOYEE') {
    const employee = await prisma.companyEmployee.findUnique({
      where: { admin_id: adminId },
      include: {
        assigned_sites: {
          select: { site_id: true }
        }
      }
    });
    
    if (employee && employee.assigned_sites.length > 0) {
      where.site_id = {
        in: employee.assigned_sites.map(s => s.site_id)
      };
    } else {
      return []; // Atanmış site yoksa boş döner
    }
  }

  // Filtreler
  if (status) where.site_status = status;
  if (search) {
    where.OR = [
      { site_name: { contains: search, mode: 'insensitive' } },
      { site_id: { contains: search, mode: 'insensitive' } }
    ];
  }

  const sites = await prisma.site.findMany({
    where,
    include: {
      admin: {
        select: {
          full_name: true,
          email: true
        }
      },
      company: {
        select: {
          company_name: true,
          company_code: true
        }
      },
      blocks: {
        where: { deleted_at: null },
        select: {
          id: true,
          block_name: true
        }
      },
      _count: {
        select: {
          users: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  return sites;
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
          email: true
        }
      },
      company: {
        select: {
          company_name: true,
          company_code: true
        }
      },
      blocks: {
        where: { deleted_at: null },
        orderBy: { block_name: 'asc' }
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
        }
      }
    }
  });

  if (!site) throw new Error('SITE_ERROR: Site bulunamadı.');

  // Yetki kontrolü
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  
  if (admin.account_type === 'INDIVIDUAL' && site.adminId !== adminId) {
    throw new Error('AUTH_ERROR: Bu siteyi görüntüleme yetkiniz yok.');
  }

  if (admin.account_type === 'COMPANY_MANAGER') {
    const company = await prisma.company.findFirst({
      where: { admin_id: adminId, deleted_at: null }
    });
    if (!company || site.company_id !== company.id) {
      throw new Error('AUTH_ERROR: Bu siteyi görüntüleme yetkiniz yok.');
    }
  }

  return site;
}

/**
 * Site silme (soft delete)
 */
export async function deleteSiteService(adminId, site_id) {
  const site = await prisma.site.findUnique({
    where: { site_id }
  });

  if (!site) throw new Error('SITE_ERROR: Site bulunamadı.');

  // Yetki kontrolü
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (site.adminId !== adminId && admin.account_type !== 'SUPER_ADMIN') {
    throw new Error('AUTH_ERROR: Bu siteyi silme yetkiniz yok.');
  }

  await prisma.site.update({
    where: { site_id },
    data: {
      deleted_at: new Date()
    }
  });

  return { message: 'Site başarıyla silindi.' };
}
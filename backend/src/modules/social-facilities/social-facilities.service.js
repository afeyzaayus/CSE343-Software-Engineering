import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Helper: siteId string (site_id) veya integer (id) olabilir
async function resolveSiteId(siteIdParam) {
  
  // Eğer sayıya dönüştürülebiliyorsa direkt kullan
  const parsed = parseInt(siteIdParam);
  if (!isNaN(parsed)) {
    return parsed;
  }
  
  // String site_id ise, veritabanından gerçek id'yi bul
  const site = await prisma.site.findUnique({
    where: { site_id: siteIdParam },
    select: { id: true }
  });
  
  if (!site) {
    throw new Error('Site bulunamadı: ' + siteIdParam);
  }
  
  return site.id;
}

// The Prisma model is `SocialAmenity` in schema.prisma (mapped to social_amenities).
// The generated client exposes it as `prisma.socialAmenity`.
export async function getFacilities(siteIdParam) {
  const siteId = await resolveSiteId(siteIdParam);
  return prisma.socialAmenity.findMany({
    where: { siteId: siteId },
    orderBy: { createdAt: 'asc' }
  });
}

export async function createFacility(siteIdParam, data) {
  const siteId = await resolveSiteId(siteIdParam);
  return prisma.socialAmenity.create({
    data: {
      siteId: siteId,
      name: data.name,
      description: data.description || '',
      status: data.status || 'Açık',
      hours: data.hours || data.operating_hours || '',
      rules: data.rules || '',
      extra: data.extra || data.capacity || ''
    }
  });
}

export async function updateFacility(siteIdParam, facilityId, data) {
  // facilityId is a string (cuid)
  const siteId = await resolveSiteId(siteIdParam);
  return prisma.socialAmenity.update({
    where: { id: facilityId },
    data: {
      name: data.name,
      description: data.description,
      status: data.status,
      hours: data.hours || data.operating_hours,
      rules: data.rules,
      extra: data.extra || data.capacity
    }
  });
}

export async function deleteFacility(siteIdParam, facilityId) {
  const siteId = await resolveSiteId(siteIdParam);
  return prisma.socialAmenity.delete({
    where: { id: facilityId }
  });
}

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// The Prisma model is `SocialAmenity` in schema.prisma (mapped to social_amenities).
// The generated client exposes it as `prisma.socialAmenity`.
export async function getFacilities(siteId) {
  return prisma.socialAmenity.findMany({
    where: { siteId: Number(siteId) },
    orderBy: { createdAt: 'asc' }
  });
}

export async function createFacility(siteId, data) {
  return prisma.socialAmenity.create({
    data: {
      siteId: Number(siteId),
      name: data.name,
      description: data.description || '',
      status: data.status || 'Açık',
      hours: data.hours || '',
      rules: data.rules || '',
      extra: data.extra || ''
    }
  });
}

export async function updateFacility(siteId, facilityId, data) {
  // facilityId is a string (cuid)
  return prisma.socialAmenity.update({
    where: { id: facilityId },
    data: {
      name: data.name,
      description: data.description,
      status: data.status,
      hours: data.hours,
      rules: data.rules,
      extra: data.extra
    }
  });
}

export async function deleteFacility(siteId, facilityId) {
  return prisma.socialAmenity.delete({
    where: { id: facilityId }
  });
}

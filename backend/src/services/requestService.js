import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createRequestService({ title, content, site_id, user_id }) {
  const site = await prisma.site.findUnique({ where: { site_id } });
  if (!site) throw new Error('SITE_NOT_FOUND');

  const user = await prisma.user.findUnique({ where: { id: user_id } });
  if (!user) throw new Error('USER_NOT_FOUND');

  return prisma.complaint.create({
    data: { title, content, siteId: site.id, userId: user.id },
    include: { user: true, site: true }
  });
}

export async function getSiteRequestsService(site_id) {
  const site = await prisma.site.findUnique({ where: { site_id } });
  if (!site) throw new Error('SITE_NOT_FOUND');

  return prisma.complaint.findMany({
    where: { siteId: site.id },
    include: { user: true },
    orderBy: { created_at: 'desc' }
  });
}

export async function getUserRequestsService(user_id) {
  return prisma.complaint.findMany({
    where: { userId: user_id },
    include: { site: true },
    orderBy: { created_at: 'desc' }
  });
}

export async function updateRequestService(requestId, data) {
  const request = await prisma.complaint.findUnique({ where: { id: parseInt(requestId) } });
  if (!request) throw new Error('REQUEST_NOT_FOUND');

  return prisma.complaint.update({
    where: { id: parseInt(requestId) },
    data: data,
    include: { user: true, site: true }
  });
}

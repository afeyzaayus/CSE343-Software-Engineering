import prisma from '../../prisma/prismaClient.js';

/**
 * Yeni duyuru oluştur
 */
export async function createAnnouncementService(announcementData) {
  const { title, content, start_date, end_date, site_id } = announcementData;

  // 1. Site kontrolü
  const site = await prisma.site.findUnique({
    where: { site_id, deleted_at: null }
  });

  if (!site) {
    throw new Error('SITE_ERROR: Belirtilen Site ID bulunamadı.');
  }

  // 2. Tarih doğrulama (ISO string karşılaştırması)
  const startDateStr = typeof start_date === 'string' ? start_date.split('T')[0] : start_date;
  const endDateStr = typeof end_date === 'string' ? end_date.split('T')[0] : end_date;

  if (startDateStr > endDateStr) {
    throw new Error('VALIDATION_ERROR: Başlangıç tarihi bitiş tarihinden önce olmalıdır.');
  }

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  try {
    // 3. Yeni duyuru oluştur
    const newAnnouncement = await prisma.announcements.create({
      data: {
        title,
        content,
        start_date: startDate,
        end_date: endDate,
        siteId: site.id
      },
      include: {
        sites: {
          select: {
            site_id: true,
            site_name: true
          }
        }
      }
    });

    return newAnnouncement;
  } catch (error) {
    // Sequence hatası ise reset et
    if (error.code === 'P2002' && error.meta?.target?.includes('id')) {
      console.warn('⚠️ ID sequence hatası detected. Resetting sequence...');
      try {
        await prisma.$executeRawUnsafe(
          `ALTER SEQUENCE public."announcements_id_seq" RESTART WITH ${(Date.now() % 1000000) + 1000}`
        );
        console.log('✅ Sequence reset edildi');
      } catch (seqError) {
        console.error('Sequence reset hatası:', seqError);
      }
    }
    throw error;
  }
}

/**
 * Belirli bir sitenin tüm duyurularını listele
 */
export async function getAnnouncementsBySiteService(site_id) {
  // 1. Site kontrolü
  const site = await prisma.site.findUnique({
    where: { site_id, deleted_at: null }
  });

  if (!site) {
    throw new Error('SITE_ERROR: Belirtilen Site ID bulunamadı.');
  }

  // 2. Site'ye ait tüm duyuruları getir
  const announcements = await prisma.announcements.findMany({
    where: { siteId: site.id },
    orderBy: { created_at: 'desc' },
    include: {
      sites: {
        select: {
          site_id: true,
          site_name: true
        }
      }
    }
  });

  // 3. Duyuruları aktif ve geçmiş olarak ayır
  const now = new Date();
  const activeAnnouncements = announcements.filter(a => new Date(a.end_date) >= now);
  const pastAnnouncements = announcements.filter(a => new Date(a.end_date) < now);

  return {
    active: activeAnnouncements,
    past: pastAnnouncements,
    all: announcements
  };
}

/**
 * Tek bir duyuruyu getir
 */
export async function getAnnouncementByIdService(announcementId, site_id) {
  // 1. Site kontrolü
  const site = await prisma.site.findUnique({
    where: { site_id, deleted_at: null }
  });

  if (!site) {
    throw new Error('SITE_ERROR: Belirtilen Site ID bulunamadı.');
  }

  // 2. Duyuruyu getir ve site kontrolü yap
  const announcement = await prisma.announcements.findFirst({
    where: {
      id: parseInt(announcementId),
      siteId: site.id
    },
    include: {
      sites: {
        select: {
          site_id: true,
          site_name: true
        }
      }
    }
  });

  if (!announcement) {
    throw new Error('ANNOUNCEMENT_ERROR: Duyuru bulunamadı veya bu siteye ait değil.');
  }

  return announcement;
}

/**
 * Duyuru güncelle
 */
export async function updateAnnouncementService(announcementId, site_id, updateData) {
  const { title, content, start_date, end_date } = updateData;

  // 1. Site kontrolü
  const site = await prisma.site.findUnique({
    where: { site_id, deleted_at: null }
  });

  if (!site) {
    throw new Error('SITE_ERROR: Belirtilen Site ID bulunamadı.');
  }

  // 2. Duyuru kontrolü
  const existingAnnouncement = await prisma.announcements.findFirst({
    where: {
      id: parseInt(announcementId),
      siteId: site.id
    }
  });

  if (!existingAnnouncement) {
    throw new Error('ANNOUNCEMENT_ERROR: Duyuru bulunamadı veya bu siteye ait değil.');
  }

  // 3. Tarih doğrulama (eğer tarihler güncelleniyorsa)
  if (start_date && end_date) {
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate >= endDate) {
      throw new Error('VALIDATION_ERROR: Başlangıç tarihi bitiş tarihinden önce olmalıdır.');
    }
  }

  // 4. Güncelleme verilerini hazırla
  const dataToUpdate = {};
  if (title) dataToUpdate.title = title;
  if (content) dataToUpdate.content = content;
  if (start_date) dataToUpdate.start_date = new Date(start_date);
  if (end_date) dataToUpdate.end_date = new Date(end_date);
  // updated_at otomatik güncellenir (@updatedAt)

  // 5. Duyuruyu güncelle
  const updatedAnnouncement = await prisma.announcements.update({
    where: { id: parseInt(announcementId) },
    data: dataToUpdate,
    include: {
      sites: {
        select: {
          site_id: true,
          site_name: true
        }
      }
    }
  });

  return updatedAnnouncement;
}

/**
 * Duyuru sil
 */
export async function deleteAnnouncementService(announcementId, site_id) {
  // 1. Site kontrolü
  const site = await prisma.site.findUnique({
    where: { site_id, deleted_at: null }
  });

  if (!site) {
    throw new Error('SITE_ERROR: Belirtilen Site ID bulunamadı.');
  }

  // 2. Duyuru kontrolü
  const existingAnnouncement = await prisma.announcements.findFirst({
    where: {
      id: parseInt(announcementId),
      siteId: site.id
    }
  });

  if (!existingAnnouncement) {
    throw new Error('ANNOUNCEMENT_ERROR: Duyuru bulunamadı veya bu siteye ait değil.');
  }

  // 3. Duyuruyu sil
  await prisma.announcements.delete({
    where: { id: parseInt(announcementId) }
  });

  return { message: 'Duyuru başarıyla silindi.' };
}
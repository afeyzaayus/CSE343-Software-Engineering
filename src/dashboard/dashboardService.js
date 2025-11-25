import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Dashboard için tüm istatistikleri hesaplar
 * @param {string} siteId - Site'ın unique string ID'si (örn: "ABCDEF")
 */
export const getDashboardStatistics = async (siteId) => {
  try {
    // 1. SİTE BİLGİSİ (site_id ile - STRING)
    const site = await prisma.site.findUnique({
      where: { site_id: siteId },  // ← site_id kullan (unique string)
      include: {
        admin: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    });

    if (!site) {
      throw new Error('Site bulunamadı');
    }

    // 2. DAİRE SAYISI (User tablosundan) - site'ın integer id'sini kullan
    const totalApartments = await prisma.user.count({
      where: { siteId: site.id }  // ← İlişki integer id ile
    });

    // 3. AKTİF DUYURULAR
    const now = new Date();
    const activeAnnouncementsCount = await prisma.announcements.count({  // ← ÇOĞUL
      where: {
        siteId: site.id,  // ← İlişki integer id ile
        start_date: { lte: now },
        end_date: { gte: now }
      }
    });

    // 4. SON 3 DUYURU
    const recentAnnouncements = await prisma.announcements.findMany({  // ← ÇOĞUL
      where: { siteId: site.id },  // ← İlişki integer id ile
      orderBy: { created_at: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        content: true,
        start_date: true,
        end_date: true,
        created_at: true
      }
    });

    // 5. İSTATİSTİKLERİ HESAPLA
    // Not: Aidat ve talep için henüz tablo olmadığı için placeholder veriler
    const statistics = {
      // Daire Doluluk Oranı
      occupancy: {
        total: totalApartments,
        occupied: totalApartments, // Şimdilik hepsi dolu kabul
        percentage: totalApartments > 0 ? 100 : 0,
        display: `${totalApartments} dolu`
      },

      // Aidat Ödeme Oranı (Placeholder)
      dues: {
        paid_count: 0,
        total_count: totalApartments,
        percentage: 0,
        display: '0 ödendi'
      },

      // Aktif Duyurular
      announcements: {
        active: activeAnnouncementsCount,
        total: await prisma.announcements.count({ where: { siteId: site.id } })  // ← ÇOĞUL + integer id
      },

      // Bekleyen Talepler (Placeholder)
      requests: {
        pending: 0,
        in_progress: 0,
        completed: 0,
        total: 0
      }
    };

    return {
      site_info: {
        site_id: site.site_id,
        site_name: site.site_name,
        site_address: site.site_address,
        admin_name: site.admin.full_name,
        admin_email: site.admin.email,
        admin_id: site.admin.id
      },
      statistics,
      recent_announcements: recentAnnouncements.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content.substring(0, 100) + '...', // İlk 100 karakter
        start_date: a.start_date,
        end_date: a.end_date,
        created_at: a.created_at,
        status: getAnnouncementStatus(a.start_date, a.end_date)
      }))
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Admin bilgisini getirir (Sağ üst köşe için)
 * @param {string} siteId - Site'ın unique string ID'si
 */
export const getAdminInfo = async (siteId) => {
  try {
    const site = await prisma.site.findUnique({
      where: { site_id: siteId },  // ← site_id kullan (string)
      include: {
        admin: {
          select: {
            id: true,
            full_name: true,
            email: true,
            account_type: true
          }
        }
      }
    });

    if (!site) {
      throw new Error('Site bulunamadı');
    }

    return {
      admin_name: site.admin.full_name,
      admin_email: site.admin.email,
      site_name: site.site_name,
      site_id: site.site_id
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Son duyuruları getirir
 * @param {string} siteId - Site'ın unique string ID'si
 * @param {number} limit - Kaç duyuru getirileceği (default: 3)
 */
export const getRecentAnnouncements = async (siteId, limit = 3) => {
  try {
    // Önce site'ı bul (integer id almak için)
    const site = await prisma.site.findUnique({
      where: { site_id: siteId },  // ← site_id kullan (string)
      select: { id: true }
    });

    if (!site) {
      throw new Error('Site bulunamadı');
    }

    const announcements = await prisma.announcements.findMany({  // ← ÇOĞUL
      where: { siteId: site.id },  // ← İlişki integer id ile
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        start_date: true,
        end_date: true,
        created_at: true
      }
    });

    return announcements.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      start_date: a.start_date,
      end_date: a.end_date,
      created_at: a.created_at,
      status: getAnnouncementStatus(a.start_date, a.end_date)
    }));

  } catch (error) {
    throw error;
  }
};

/**
 * HELPER FUNCTION: Duyuru durumunu hesapla
 * @param {Date} start_date - Duyuru başlangıç tarihi
 * @param {Date} end_date - Duyuru bitiş tarihi
 * @returns {string} - Durum: Acil, Önemli, Normal, Planlanan, Geçmiş
 */
function getAnnouncementStatus(start_date, end_date) {
  const now = new Date();
  const start = new Date(start_date);
  const end = new Date(end_date);

  if (now < start) {
    return 'Planlanan';
  } else if (now >= start && now <= end) {
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 3) return 'Acil';
    if (daysLeft <= 7) return 'Önemli';
    return 'Normal';
  } else {
    return 'Geçmiş';
  }
}
import prisma from '../../prisma/prismaClient.js';

/**
 * Dashboard için tüm istatistikleri hesaplar
 */
export async function getDashboardStatisticsService(siteId) {
  // 1. SİTE BİLGİSİ
  const site = await prisma.site.findUnique({
    where: { id: siteId },
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
    throw new Error('SITE_ERROR: Site bulunamadı.');
  }

  // 2. DAİRE SAYISI (User tablosundan)
  const totalApartments = await prisma.user.count({
    where: { siteId: siteId, deleted_at: null }
  });

  // 3. AKTİF DUYURULAR
  const now = new Date();
  const activeAnnouncementsCount = await prisma.announcements.count({
    where: {
      siteId: siteId,
      start_date: { lte: now },
      end_date: { gte: now }
    }
  });

  // 4. SON 3 DUYURU
  const recentAnnouncements = await prisma.announcements.findMany({
    where: { siteId: siteId },
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

  // 5. TOPLAM DUYURU SAYISI
  const totalAnnouncements = await prisma.announcements.count({
    where: { siteId }
  });

  // 6. İSTATİSTİKLERİ HESAPLA
  const statistics = {
    // Daire Doluluk Oranı
    occupancy: {
      total: totalApartments,
      occupied: totalApartments, // Şimdilik hepsi dolu kabul
      percentage: totalApartments > 0 ? 100 : 0,
      display: `${totalApartments} dolu`
    },

    // Aidat Ödeme Oranı (Placeholder - gelecekte güncellenecek)
    dues: {
      paid_count: 0,
      total_count: totalApartments,
      percentage: 0,
      display: '0 ödendi'
    },

    // Aktif Duyurular
    announcements: {
      active: activeAnnouncementsCount,
      total: totalAnnouncements
    },

    // Bekleyen Talepler (Placeholder - gelecekte güncellenecek)
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
      content: a.content.length > 100 ? a.content.substring(0, 100) + '...' : a.content,
      start_date: a.start_date,
      end_date: a.end_date,
      created_at: a.created_at,
      status: getAnnouncementStatus(a.start_date, a.end_date)
    }))
  };
}

/**
 * Son duyuruları getirir
 */
export async function getRecentAnnouncementsService(siteId, limit = 3) {
  const announcements = await prisma.announcements.findMany({
    where: { siteId: siteId },
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
}

/**
 * Duyuru durumunu hesapla (Helper)
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
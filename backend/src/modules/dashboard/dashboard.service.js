import prisma from '../../prisma/prismaClient.js';

/**
 * Dashboard için tüm istatistikleri hesaplar
 */
export async function getDashboardStatisticsService(siteId) {
  // 1. SİTE BİLGİSİ - site_id string ile arama
  const site = await prisma.site.findUnique({
    where: { site_id: siteId },  // site_id kullan (string)
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

  // 2. DAİRE SAYISI (User tablosundan) - integer id ile
  const totalApartments = await prisma.user.count({
    where: { siteId: site.id }
  });

  // 2.5. BLOK SAYISI VE TOPLAM KAPASİTE - blocks tablosundan
  const totalBlocks = await prisma.blocks.count({
    where: { site_id: site.id }
  });

  // Blokların toplam daire kapasitesini hesapla
  const blocksWithCapacity = await prisma.blocks.findMany({
    where: { site_id: site.id },
    select: { apartment_count: true }
  });

  const totalCapacity = blocksWithCapacity.reduce((sum, block) => sum + (block.apartment_count || 0), 0);

  // 3. AKTİF DUYURULAR - integer id ile
  const now = new Date();
  const activeAnnouncementsCount = await prisma.announcements.count({
    where: {
      siteId: site.id,
      start_date: { lte: now },
      end_date: { gte: now }
    }
  });

  // 4. SON 3 DUYURU - integer id ile
  const recentAnnouncements = await prisma.announcements.findMany({
    where: { siteId: site.id },
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

  // 5. TOPLAM DUYURU SAYISI - integer id ile
  const totalAnnouncements = await prisma.announcements.count({
    where: { siteId: site.id }
  });

  // 5.5. ŞİKAYET/TALEP SAYILARI - integer id ile
  const totalComplaints = await prisma.complaints.count({
    where: { siteId: site.id }
  });

  const pendingComplaints = await prisma.complaints.count({
    where: { 
      siteId: site.id,
      status: 'PENDING'
    }
  });

  const inProgressComplaints = await prisma.complaints.count({
    where: { 
      siteId: site.id,
      status: 'IN_PROGRESS'
    }
  });

  const resolvedComplaints = await prisma.complaints.count({
    where: { 
      siteId: site.id,
      status: 'RESOLVED'
    }
  });

  // 6. AİDAT ÖDEME ORANI HESAPLA
  // Bu ay ödeme yapan kişi sayısını bul
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const thisMonthPayments = await prisma.payments.findMany({
    where: {
      siteId: site.id,
      payment_date: {
        gte: new Date(currentYear, currentMonth, 1),
        lt: new Date(currentYear, currentMonth + 1, 1)
      }
    },
    select: { userId: true }
  });

  // Ödeme yapan unique kullanıcı sayısı
  const paidUserIds = new Set(thisMonthPayments.map(p => p.userId));
  const paidCount = paidUserIds.size;

  // 7. İSTATİSTİKLERİ HESAPLA
  const averageApartmentsPerBlock = totalBlocks > 0 ? Math.round(totalCapacity / totalBlocks) : 0;

  const statistics = {
    // Blok Sayısı
    blocks: {
      total: totalBlocks,
      display: `${totalBlocks} blok`
    },

    // Daire/Blok - Ortalama daire sayısı
    apartmentsPerBlock: {
      average: averageApartmentsPerBlock,
      display: `${averageApartmentsPerBlock} daire/blok`
    },

    // Daire Doluluk Oranı
    occupancy: {
      total: totalCapacity, // Toplam kapasite
      occupied: totalApartments, // Dolu daire sayısı
      percentage: totalCapacity > 0 ? Math.round((totalApartments / totalCapacity) * 100) : 0,
      display: `${totalApartments}/${totalCapacity} daire`
    },

    // Aidat Ödeme Oranı - Güncellendi
    dues: {
      paid_count: paidCount,
      total_count: totalApartments,
      percentage: totalApartments > 0 ? Math.round((paidCount / totalApartments) * 100) : 0,
      display: `${paidCount}/${totalApartments} ödendi`
    },

    // Aktif Duyurular
    announcements: {
      active: activeAnnouncementsCount,
      total: totalAnnouncements
    },

    // Şikayet/Talepler
    requests: {
      pending: pendingComplaints,
      in_progress: inProgressComplaints,
      resolved: resolvedComplaints,
      total: totalComplaints
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
  // Önce site_id ile site'ı bul
  const site = await prisma.site.findUnique({
    where: { site_id: siteId }
  });

  if (!site) {
    throw new Error('SITE_ERROR: Site bulunamadı.');
  }

  // Integer id ile duyuruları getir
  const announcements = await prisma.announcements.findMany({
    where: { siteId: site.id },
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
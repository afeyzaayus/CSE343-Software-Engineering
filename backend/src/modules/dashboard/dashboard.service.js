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

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // JS getMonth() 0-11 döndürür, bizde 1-12 kullanılıyor
  const currentYear = now.getFullYear();

  // PARALEL SORGULAR - Performans optimizasyonu
  const [siteBlocks, activeAnnouncementsCount, recentAnnouncements, totalAnnouncements, complaintStats, siteUsers, thisMonthDues] = await Promise.all([
    // Blokları getir
    prisma.blocks.findMany({
      where: { site_id: site.id },
      select: { id: true, apartment_count: true, block_name: true }
    }),
    // Aktif duyuruları say
    prisma.announcements.count({
      where: {
        siteId: site.id,
        start_date: { lte: now },
        end_date: { gte: now }
      }
    }),
    // Son 3 duyuruyu getir
    prisma.announcements.findMany({
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
    }),
    // Toplam duyuru sayısı
    prisma.announcements.count({
      where: { siteId: site.id }
    }),
    // Şikayet/talep sayıları (groupBy ile)
    prisma.complaints.groupBy({
      by: ['status'],
      where: { siteId: site.id },
      _count: { id: true }
    }),
    // Site sakinleri (dolu daireleri hesaplamak için)
    prisma.user.findMany({
      where: {
        siteId: site.id,
        deleted_at: null,
        apartment_no: { not: null }
      },
      select: { apartment_no: true, block_id: true }
    }),
    // Bu ay ödenen aidatlar
    prisma.monthlyDues.findMany({
      where: {
        siteId: site.id,
        month: currentMonth,
        year: currentYear,
        deleted_at: null
      },
      select: { payment_status: true, apartmentId: true }
    })
  ]);

  // Sonuçları işle
  const totalBlocks = siteBlocks.length;
  const totalApartments = siteBlocks.reduce((sum, block) => sum + (block.apartment_count || 0), 0);

  // Dolu daireleri hesapla (unique apartment_no sayısı)
  const occupiedApartments = new Set(siteUsers.map(u => `${u.block_id}-${u.apartment_no}`)).size;

  // Şikayet istatistikleri
  const totalComplaints = complaintStats.reduce((sum, stat) => sum + stat._count.id, 0);
  const pendingComplaints = complaintStats.find(s => s.status === 'PENDING')?._count.id || 0;
  const inProgressComplaints = complaintStats.find(s => s.status === 'IN_PROGRESS')?._count.id || 0;
  const resolvedComplaints = complaintStats.find(s => s.status === 'RESOLVED')?._count.id || 0;

  // Ödenen aidatlar (DAIRE BAZINDA - kişi bazında değil)
  // Ödenen daireleri unique apartmentId'ler ile say
  const paidApartments = new Set(
    thisMonthDues
      .filter(d => d.payment_status === 'PAID' && d.apartmentId)
      .map(d => d.apartmentId)
  );
  const paidCount = paidApartments.size;

  // 7. İSTATİSTİKLERİ HESAPLA
  const averageApartmentsPerBlock = totalBlocks > 0 ? Math.round(totalApartments / totalBlocks) : 0;

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
      total: totalApartments, // Tüm bloklardaki toplam daire sayısı
      occupied: occupiedApartments, // Dolu daire sayısı
      percentage: totalApartments > 0 ? Math.round((occupiedApartments / totalApartments) * 100) : 0,
      display: `${occupiedApartments}/${totalApartments} daire`
    },

    // Aidat Ödeme Oranı - Güncellendi
    dues: {
      paid_count: paidCount,
      total_count: occupiedApartments,
      percentage: occupiedApartments > 0 ? Math.round((paidCount / occupiedApartments) * 100) : 0,
      display: `${paidCount}/${occupiedApartments} ödendi`
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
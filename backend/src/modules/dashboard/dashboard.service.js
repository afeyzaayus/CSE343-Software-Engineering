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

  console.log('\n🔍 DASHBOARD DEBUG - Site:', site.site_name, '(ID:', site.id, ')');

  // 2. TOPLAM KULLANICI SAYISI (aidat hesabı için)
  const totalUsers = await prisma.user.count({
    where: { siteId: site.id }
  });
  console.log('👥 Kayıtlı kullanıcı sayısı:', totalUsers);

  // 2.5. TÜM BLOKLARI DETAYLI ÇEK
  const allBlocks = await prisma.blocks.findMany({
    where: { 
      site_id: site.id,
      deleted_at: null
    },
    include: {
      apartments: {
        where: {
          deleted_at: null
        },
        select: {
          id: true,
          apartment_no: true,
          is_occupied: true,
          resident_count: true
        }
      }
    }
  });

  const totalBlocks = allBlocks.length;
  console.log('🏢 Blok sayısı:', totalBlocks);
  console.log('📦 Bloklar:', allBlocks.map(b => b.block_name));

  // 3. DAİRE İSTATİSTİKLERİNİ BLOK BLOK HESAPLA
  let totalApartments = 0;
  let occupiedApartments = 0;

  console.log('\n🏗️ BLOK BAZINDA İSTATİSTİKLER:');
  allBlocks.forEach(block => {
    const blockTotal = block.apartments.length;
    const blockOccupied = block.apartments.filter(apt => apt.is_occupied).length;
    
    totalApartments += blockTotal;
    occupiedApartments += blockOccupied;
    
    console.log(`   📍 ${block.block_name}:`);
    console.log(`      - Toplam daire: ${blockTotal}`);
    console.log(`      - Dolu daire: ${blockOccupied}`);
    console.log(`      - Boş daire: ${blockTotal - blockOccupied}`);
    console.log(`      - Daireler:`, block.apartments.map(apt => 
      `${apt.apartment_no}(${apt.is_occupied ? 'Dolu-' + apt.resident_count + ' kişi' : 'Boş'})`
    ).join(', '));
  });
  
  console.log('\n🏘️ GENEL TOPLAM:');
  console.log('   - Toplam daire sayısı:', totalApartments);
  console.log('   - Dolu daire sayısı:', occupiedApartments);
  console.log('   - Boş daire sayısı:', totalApartments - occupiedApartments);

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

  // 6. AİDAT ÖDEME ORANI HESAPLA (DAİRE BAZINDA)
  // Bu ay ödeme yapan DAİRELERİ bul (monthlyDues tablosundan)
  const currentMonth = now.getMonth() + 1; // JavaScript 0-11, database 1-12
  const currentYear = now.getFullYear();
  
  const thisMonthPayments = await prisma.monthlyDues.findMany({
    where: {
      siteId: site.id,
      month: currentMonth,
      year: currentYear,
      payment_status: 'PAID',
      apartmentId: { not: null } // Apartman ID'si olan kayıtlar
    },
    select: { apartmentId: true }
  });

  // Ödeme yapan unique daire sayısı
  const paidApartmentIds = new Set(thisMonthPayments.map(p => p.apartmentId));
  const paidApartmentCount = paidApartmentIds.size;
  
  console.log('💰 AİDAT ÖDEME İSTATİSTİKLERİ:');
  console.log('   - Bu ay ödeme yapan daire sayısı:', paidApartmentCount);
  console.log('   - Toplam daire sayısı:', totalApartments);
  console.log('   - Ödeme yapan daire ID\'leri:', Array.from(paidApartmentIds));

  // 7. İSTATİSTİKLERİ HESAPLA
  const averageApartmentsPerBlock = totalBlocks > 0 ? Math.round(totalApartments / totalBlocks) : 0;

  console.log('\n📈 DOLULUK ORANI HESAPLANIYOR:');
  console.log('   - Dolu daireler:', occupiedApartments);
  console.log('   - Toplam daireler:', totalApartments);
  const occupancyPercentage = totalApartments > 0 ? Math.round((occupiedApartments / totalApartments) * 100) : 0;
  console.log('   - Doluluk yüzdesi:', occupancyPercentage + '%');
  console.log('   ✅ apartments tablosundan gerçek veriler kullanılıyor\n');

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

    // Daire Doluluk Oranı (DÜZELTME: apartments tablosundan)
    occupancy: {
      total: totalApartments, // Toplam daire sayısı (apartments tablosu)
      occupied: occupiedApartments, // Dolu daire sayısı (is_occupied: true)
      empty: totalApartments - occupiedApartments, // Boş daire sayısı
      percentage: occupancyPercentage,
      display: `${occupiedApartments}/${totalApartments} daire`
    },

    // Aidat Ödeme Oranı (Daire bazında - monthlyDues.apartmentId)
    dues: {
      paid_count: paidApartmentCount,
      total_count: totalApartments,
      percentage: totalApartments > 0 ? Math.round((paidApartmentCount / occupiedApartments) * 100) : 0,
      display: `${paidApartmentCount}/${occupiedApartments} daire ödedi`
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
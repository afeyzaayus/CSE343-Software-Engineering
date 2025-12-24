import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Türkçe payment method değerlerini Prisma enum değerlerine çevir
const paymentMethodMap = {
  'nakit': 'CASH',
  'cash': 'CASH',
  'kredi_karti': 'CREDIT_CARD',
  'kredi kartı': 'CREDIT_CARD',
  'kredi karti': 'CREDIT_CARD',
  'credit_card': 'CREDIT_CARD',
  'banka_transferi': 'BANK_TRANSFER',
  'banka transferi': 'BANK_TRANSFER',
  'havale': 'BANK_TRANSFER',
  'eft': 'BANK_TRANSFER',
  'bank_transfer': 'BANK_TRANSFER',
  'cek': 'CHECK',
  'çek': 'CHECK',
  'check': 'CHECK',
  'diger': 'OTHER',
  'diğer': 'OTHER',
  'other': 'OTHER'
};

function normalizePaymentMethod(method) {
  if (!method) return 'OTHER';
  const normalized = method.toLowerCase().trim();
  return paymentMethodMap[normalized] || method.toUpperCase();
}



// ===== SİTE SAKİNLERİNİ GETIRME =====
export async function getResidentsBySiteService(siteIdParam) {
  
  // siteId validasyonu ve dönüştürme
  let siteId;
  
  if (typeof siteIdParam === 'string' && isNaN(parseInt(siteIdParam))) {
    // String ve sayı olmayan değer (site_id: "ABCDEF" gibi)
    const site = await prisma.Site.findUnique({
      where: { site_id: siteIdParam },
      select: { id: true }
    });
    
    if (!site) {
      throw new Error('Site bulunamadı: ' + siteIdParam);
    }
    siteId = site.id;
  } else {
    // Integer tipinde veya sayıya dönüştürülebilir
    siteId = parseInt(siteIdParam);
    if (isNaN(siteId)) {
      throw new Error('siteId geçersiz: ' + siteIdParam);
    }
  }
  
  const residents = await prisma.User.findMany({
    where: { siteId: siteId },
    select: {
      id: true,
      full_name: true,
      phone_number: true,
      apartment_no: true,
      blocks: {
        select: {
          block_name: true
        }
      }
    },
    orderBy: [
      { apartment_no: 'asc' }
    ]
  });

  // block_name'i düz alana dönüştür
  return residents.map(r => ({
    id: r.id,
    full_name: r.full_name,
    phone_number: r.phone_number,
    block_no: r.blocks?.block_name || '-',
    apartment_no: r.apartment_no || '-'
  }));
}

// ===== AYLIK AIDATLARI GETIRME (Ay ve yıla göre) =====
export async function getMonthlyDuesBySiteService(siteIdParam, month, year) {
  // siteId validasyonu ve dönüştürme
  let siteId;
  
  if (typeof siteIdParam === 'string' && isNaN(parseInt(siteIdParam))) {
    const site = await prisma.Site.findUnique({
      where: { site_id: siteIdParam },
      select: { id: true }
    });
    if (!site) throw new Error('Site bulunamadı: ' + siteIdParam);
    siteId = site.id;
  } else {
    siteId = parseInt(siteIdParam);
    if (isNaN(siteId)) throw new Error('siteId geçersiz: ' + siteIdParam);
  }

  const monthlyDues = await prisma.monthlyDues.findMany({
    where: {
      siteId: siteId,
      month: parseInt(month),
      year: parseInt(year),
      deleted_at: null
    },
    include: {
      users: {
        select: {
          id: true,
          full_name: true,
          phone_number: true,
          apartment_no: true,
          blocks: {
            select: {
              block_name: true
            }
          }
        }
      },
      paid_by_user: {
        select: {
          id: true,
          full_name: true
        }
      }
    },
    orderBy: [
      { users: { apartment_no: 'asc' } }
    ]
  });

  return monthlyDues.map(due => ({
    id: due.id,
    userId: due.userId,
    siteId: due.siteId,
    month: due.month,
    year: due.year,
    amount: due.amount,
    due_date: due.due_date,
    payment_status: due.payment_status,
    paid_date: due.paid_date,
    payment_method: due.payment_method,
    paid_by_user: due.paid_by_user,  // Ödemeyi yapan kişi
    user: {
      id: due.users.id,
      full_name: due.users.full_name,
      phone_number: due.users.phone_number,
      block_no: due.users.blocks?.block_name || '-',
      apartment_no: due.users.apartment_no || '-'
    }
  }));
}

// ===== AYLIK AIDATLARI OLUŞTURMA (Tüm sakinler için) =====
export async function createMonthlyDuesForAllResidentsService(siteIdParam, month, year, amount, due_date) {
  // siteId validasyonu
  let siteId;
  
  if (typeof siteIdParam === 'string' && isNaN(parseInt(siteIdParam))) {
    const site = await prisma.Site.findUnique({
      where: { site_id: siteIdParam },
      select: { id: true }
    });
    if (!site) throw new Error('Site bulunamadı: ' + siteIdParam);
    siteId = site.id;
  } else {
    siteId = parseInt(siteIdParam);
    if (isNaN(siteId)) throw new Error('siteId geçersiz: ' + siteIdParam);
  }

  // Tüm sakinleri apartment_id ile birlikte getir
  const residents = await prisma.User.findMany({
    where: {
      siteId: siteId,
      deleted_at: null,
      account_status: 'ACTIVE'
    },
    select: { id: true, apartment_id: true }
  });

  if (residents.length === 0) {
    throw new Error('Bu siteye ait aktif sakin bulunamadı.');
  }

  // Her sakin için aidatı oluştur
  const created = [];
  const dueDateObj = new Date(due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDateObj.setHours(0, 0, 0, 0);
  
  const isOverdue = dueDateObj < today;
  const initialStatus = isOverdue ? 'OVERDUE' : 'UNPAID';
  
  for (const resident of residents) {
    try {
      const due = await prisma.monthlyDues.upsert({
        where: {
          userId_siteId_month_year: {
            userId: resident.id,
            siteId: siteId,
            month: parseInt(month),
            year: parseInt(year)
          }
        },
        create: {
          userId: resident.id,
          apartmentId: resident.apartment_id,  // Daire bazında ödeme
          siteId: siteId,
          month: parseInt(month),
          year: parseInt(year),
          amount: parseFloat(amount),
          due_date: new Date(due_date),
          payment_status: initialStatus
        },
        update: {
          amount: parseFloat(amount),
          due_date: new Date(due_date),
          payment_status: initialStatus,
          apartmentId: resident.apartment_id  // Varsa güncelle
        }
      });
      created.push(due);
    } catch (e) {
    }
  }

  return {
    total: residents.length,
    created: created.length,
    message: `${created.length}/${residents.length} sakin için ${month}/${year} aidatı oluşturuldu.`
  };
}

// ===== AYLIK ÖDEME KAYDETME (UNPAID -> PAID) - DAIRE BAZINDA =====
export async function recordMonthlyPaymentService(monthlyDueId, payment_method, paid_by_user_id = null, amount = null) {
  const monthlyDue = await prisma.monthlyDues.findUnique({
    where: { id: parseInt(monthlyDueId) },
    include: {
      users: {
        select: {
          id: true,
          apartment_id: true,
          full_name: true,
          apartment_no: true,
          blocks: {
            select: {
              block_name: true
            }
          }
        }
      }
    }
  });

  if (!monthlyDue) {
    throw new Error('Aidatı kaydı bulunamadı.');
  }

  // apartmentId'yi al - null ise user'dan apartment_id'yi kullan
  let apartment_id = monthlyDue.apartmentId;
  if (!apartment_id && monthlyDue.users.apartment_id) {
    apartment_id = monthlyDue.users.apartment_id;
  }

  const normalized_payment_method = normalizePaymentMethod(payment_method);
  const paid_date = new Date();
  // Eğer amount gönderilmişse kullan, yoksa mevcut amount'u koru
  const finalAmount = amount ? parseFloat(amount) : monthlyDue.amount;


  // Önceki ayları OVERDUE olarak işaretle
  const previousMonth = monthlyDue.month - 1;
  const previousYear = previousMonth === 0 ? monthlyDue.year - 1 : monthlyDue.year;
  const previousMonthValue = previousMonth === 0 ? 12 : previousMonth;

  await prisma.monthlyDues.updateMany({
    where: {
      userId: monthlyDue.userId,
      siteId: monthlyDue.siteId,
      month: previousMonthValue,
      year: previousYear,
      payment_status: 'UNPAID'
    },
    data: {
      payment_status: 'OVERDUE'
    }
  });

  // DAIRE BAZINDA ÖDEME: Aynı dairede yaşayan tüm kişilerin aidatını PAID işaretle
  // KURAL 1: apartmentId'ye göre ara
  // KURAL 2: Bulunmazsa user'ın apartment_id'siyle ara
  // KURAL 3: Hala bulunmazsa block_no + apartment_no kombinasyonuyla ara
  let updatedDues;
  let usersToUpdate = [];
  
  if (apartment_id) {
    // Kural 1: apartmentId'ye göre aynı dairede yaşayan kullanıcıları bul
    
    usersToUpdate = await prisma.User.findMany({
      where: {
        apartment_id: apartment_id,
        deleted_at: null,
        siteId: monthlyDue.siteId
      },
      select: { id: true }
    });
  }
  
  // Eğer kullanıcı bulunamazsa, block_id + apartment_no kombinasyonuyla ara
  if (usersToUpdate.length === 0 && monthlyDue.users.block_id && monthlyDue.users.apartment_no) {
    
    // Önce siteId olmadan ara
    const usersWithoutSite = await prisma.User.findMany({
      where: {
        block_id: monthlyDue.users.block_id,
        apartment_no: monthlyDue.users.apartment_no,
        deleted_at: null
      },
      select: { id: true, siteId: true }
    });
    
    // siteId ile filtrele
    usersToUpdate = usersWithoutSite.filter(u => u.siteId === monthlyDue.siteId).map(u => ({ id: u.id }));
  }

  const userIds = usersToUpdate.map(u => u.id);

  // Tüm kişilerin bu ayın aidatını PAID işaretle
  if (userIds.length > 0) {
    updatedDues = await prisma.monthlyDues.updateMany({
      where: {
        userId: { in: userIds },
        siteId: monthlyDue.siteId,
        month: monthlyDue.month,
        year: monthlyDue.year,
        deleted_at: null
      },
      data: {
        payment_status: 'PAID',
        paid_date: paid_date,
        payment_method: normalized_payment_method,
        paid_by_user_id: paid_by_user_id || monthlyDue.userId,
        amount: finalAmount
      }
    });
  } else if (monthlyDue.users.block_id && monthlyDue.users.apartment_no) {
    // Eğer siteId ile hiç kimse bulunamadıysa, aynı dairede yaşayan TÜÜN KISILERI güncelle (siteId kontrolü YOK)
    
    const allUsersInApartment = await prisma.User.findMany({
      where: {
        block_id: monthlyDue.users.block_id,
        apartment_no: monthlyDue.users.apartment_no,
        deleted_at: null
      },
      select: { id: true }
    });
    
    const fallbackUserIds = allUsersInApartment.map(u => u.id);
    
    if (fallbackUserIds.length > 0) {
      updatedDues = await prisma.monthlyDues.updateMany({
        where: {
          userId: { in: fallbackUserIds },
          siteId: monthlyDue.siteId,
          month: monthlyDue.month,
          year: monthlyDue.year,
          deleted_at: null
        },
        data: {
          payment_status: 'PAID',
          paid_date: paid_date,
          payment_method: normalized_payment_method,
          paid_by_user_id: paid_by_user_id || monthlyDue.userId,
          amount: finalAmount
        }
      });
    } else {
      // En son fallback: sadece ödemeyi yapan kişi
      updatedDues = await prisma.monthlyDues.updateMany({
        where: {
          userId: monthlyDue.userId,
          siteId: monthlyDue.siteId,
          month: monthlyDue.month,
          year: monthlyDue.year,
          deleted_at: null
        },
        data: {
          payment_status: 'PAID',
          paid_date: paid_date,
          payment_method: normalized_payment_method,
          paid_by_user_id: paid_by_user_id || monthlyDue.userId
        }
      });
    }
  } else {
    // Fallback: sadece ödemeyi yapan kişiyi PAID işaretle
    updatedDues = await prisma.monthlyDues.updateMany({
      where: {
        userId: monthlyDue.userId,
        siteId: monthlyDue.siteId,
        month: monthlyDue.month,
        year: monthlyDue.year,
        deleted_at: null
      },
      data: {
        payment_status: 'PAID',
        paid_date: paid_date,
        payment_method: normalized_payment_method,
        paid_by_user_id: paid_by_user_id || monthlyDue.userId
      }
    });
  }


  // Güncellenmiş kaydı geri döndür
  const updated = await prisma.monthlyDues.findUnique({
    where: { id: parseInt(monthlyDueId) },
    include: {
      users: {
        select: {
          id: true,
          full_name: true,
          apartment_no: true,
          apartment_id: true
        }
      },
      paid_by_user: {
        select: {
          id: true,
          full_name: true
        }
      }
    }
  });

  return updated;
}

// ===== OVERDUE İSTATİSTİKLERİ =====
export async function getOverdueStatsService(siteIdParam) {
  let siteId;
  
  if (typeof siteIdParam === 'string' && isNaN(parseInt(siteIdParam))) {
    const site = await prisma.Site.findUnique({
      where: { site_id: siteIdParam },
      select: { id: true }
    });
    if (!site) throw new Error('Site bulunamadı: ' + siteIdParam);
    siteId = site.id;
  } else {
    siteId = parseInt(siteIdParam);
    if (isNaN(siteId)) throw new Error('siteId geçersiz: ' + siteIdParam);
  }

  const stats = await prisma.monthlyDues.groupBy({
    by: ['payment_status'],
    where: { siteId: siteId, deleted_at: null },
    _count: { id: true },
    _sum: { amount: true }
  });

  return stats.reduce((acc, stat) => {
    acc[stat.payment_status] = {
      count: stat._count.id,
      total: stat._sum.amount || 0
    };
    return acc;
  }, {});
}
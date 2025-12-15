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

// ===== ÖDEME OLUŞTURMA (Bir kez oluşturulduktan sonra değiştirilemez) =====
export async function createPaymentService(paymentData) {
  const { userId, siteId: siteIdParam, amount, payment_date, payment_method: rawPaymentMethod, description } = paymentData;
  
  // Payment method'u normalize et (Türkçe -> Enum)
  const payment_method = normalizePaymentMethod(rawPaymentMethod);

  // siteId'yi integer'a çevir (string veya int olabilir)
  let siteId;
  if (typeof siteIdParam === 'string' && isNaN(parseInt(siteIdParam))) {
    // String ve sayı olmayan değer (site_id: "ABCDEF" gibi)
    const site = await prisma.Site.findUnique({
      where: { site_id: siteIdParam },
      select: { id: true }
    });
    
    if (!site) {
      throw new Error('VALIDATION_ERROR: Site bulunamadı: ' + siteIdParam);
    }
    siteId = site.id;
  } else {
    // Integer tipinde veya sayıya dönüştürülebilir
    siteId = parseInt(siteIdParam);
    if (isNaN(siteId)) {
      throw new Error('VALIDATION_ERROR: siteId geçersiz: ' + siteIdParam);
    }
  }

  // Kullanıcının site'ye ait olup olmadığını kontrol et
  const user = await prisma.User.findFirst({
    where: {
      id: userId,
      siteId: siteId
    }
  });

  if (!user) {
    throw new Error('AUTH_ERROR: Kullanıcı bu siteye ait değil.');
  }

  // Ödemeyi oluştur
  // payment_date sadece tarih içeriyorsa (saat bilgisi yoksa), şu anki saati ekle
  let paymentDateTime;
  const inputDate = new Date(payment_date);
  
  // Eğer saat bilgisi 00:00:00 ise (sadece tarih gönderilmişse), şu anki saati kullan
  if (inputDate.getHours() === 0 && inputDate.getMinutes() === 0 && inputDate.getSeconds() === 0) {
    const now = new Date();
    paymentDateTime = new Date(
      inputDate.getFullYear(),
      inputDate.getMonth(),
      inputDate.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );
  } else {
    paymentDateTime = inputDate;
  }

  const payment = await prisma.payments.create({
    data: {
      userId,
      siteId,
      amount: parseFloat(amount),
      payment_date: paymentDateTime,
      payment_method,
      description
    },
    include: {
      users: {
        select: {
          id: true,
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

  // Response formatını düzenle
  return {
    ...payment,
    user: {
      id: payment.users.id,
      full_name: payment.users.full_name,
      block_no: payment.users.blocks?.block_name || '-',
      apartment_no: payment.users.apartment_no || '-'
    },
    users: undefined
  };
}

// ===== TÜM ÖDEMELERİ GETIRME (Site bazında) =====
export async function getPaymentsBySiteService(siteIdParam, filters = {}) {
  // siteId validasyonu ve debug
  console.log('getPaymentsBySiteService - siteIdParam:', siteIdParam, 'type:', typeof siteIdParam);
  
  if (!siteIdParam) {
    throw new Error('VALIDATION_ERROR: siteId gereklidir');
  }

  // siteIdParam String olabilir (site_id: "ABCDEF") veya Int olabilir (id: 1)
  // Eğer String ise, site tablosundan id'yi bul
  let siteId;
  
  if (typeof siteIdParam === 'string' && isNaN(parseInt(siteIdParam))) {
    // String ve sayı olmayan değer (site_id: "ABCDEF" gibi)
    console.log('getPaymentsBySiteService - site_id (String) ile aranıyor:', siteIdParam);
    const site = await prisma.Site.findUnique({
      where: { site_id: siteIdParam },
      select: { id: true }
    });
    
    if (!site) {
      throw new Error('VALIDATION_ERROR: Site bulunamadı: ' + siteIdParam);
    }
    siteId = site.id;
  } else {
    // Integer tipinde veya sayıya dönüştürülebilir
    const parsedSiteId = parseInt(siteIdParam);
    console.log('getPaymentsBySiteService - parsedSiteId:', parsedSiteId, 'isNaN:', isNaN(parsedSiteId));
    
    if (isNaN(parsedSiteId)) {
      throw new Error('VALIDATION_ERROR: siteId sayı olmalıdır. Gelen değer: ' + siteIdParam);
    }
    siteId = parsedSiteId;
  }

  console.log('getPaymentsBySiteService - Final siteId (Int):', siteId);

  const { startDate, endDate, userId, payment_method } = filters;

  const where = { siteId };

  if (startDate && endDate) {
    where.payment_date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  if (userId) {
    where.userId = parseInt(userId);
  }

  if (payment_method) {
    where.payment_method = payment_method;
  }

  const payments = await prisma.payments.findMany({
    where,
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
      }
    },
    orderBy: {
      payment_date: 'desc'
    }
  });

  // Response formatını düzenle
  return payments.map(payment => {
    // Eğer user null ise, boş bir user objesi return et
    const user = payment.users || {};
    return {
      ...payment,
      user: {
        id: user.id || null,
        full_name: user.full_name || '-',
        phone_number: user.phone_number || '-',
        block_no: user.blocks?.block_name || '-',
        apartment_no: user.apartment_no || '-'
      },
      users: undefined
    };
  });
}

// ===== TEK BİR ÖDEME DETAYI =====
export async function getPaymentByIdService(paymentId) {
  const payment = await prisma.payments.findUnique({
    where: { id: parseInt(paymentId) },
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
      }
    }
  });

  if (!payment) {
    throw new Error('NOT_FOUND: Ödeme bulunamadı.');
  }

  // Response formatını düzenle
  return {
    ...payment,
    user: {
      id: payment.users.id,
      full_name: payment.users.full_name,
      phone_number: payment.users.phone_number,
      block_no: payment.users.blocks?.block_name || '-',
      apartment_no: payment.users.apartment_no || '-'
    },
    users: undefined
  };
}

// ===== KULLANICININ TÜM ÖDEMELERİ =====
export async function getUserPaymentsService(userId) {
  const payments = await prisma.payments.findMany({
    where: { userId: parseInt(userId) },
    orderBy: {
      payment_date: 'desc'
    }
  });

  return payments;
}

// ===== ÖDEME İSTATİSTİKLERİ (Site bazında) =====
export async function getPaymentStatsService(siteId, filters = {}) {
  const { startDate, endDate } = filters;

  const where = { siteId: parseInt(siteId) };

  if (startDate && endDate) {
    where.payment_date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  // Toplam ödeme sayısı
  const totalPayments = await prisma.payments.count({ where });

  // Toplam tutar
  const totalAmount = await prisma.payments.aggregate({
    where,
    _sum: {
      amount: true
    }
  });

  // Ödeme yöntemine göre dağılım
  const paymentsByMethod = await prisma.payments.groupBy({
    by: ['payment_method'],
    where,
    _count: {
      id: true
    },
    _sum: {
      amount: true
    }
  });

  return {
    totalPayments,
    totalAmount: totalAmount._sum.amount || 0,
    paymentsByMethod
  };
}

// ===== SİTE SAKİNLERİNİ GETIRME =====
export async function getResidentsBySiteService(siteIdParam) {
  console.log('getResidentsBySiteService - siteIdParam:', siteIdParam, 'type:', typeof siteIdParam);
  
  // siteId validasyonu ve dönüştürme
  let siteId;
  
  if (typeof siteIdParam === 'string' && isNaN(parseInt(siteIdParam))) {
    // String ve sayı olmayan değer (site_id: "ABCDEF" gibi)
    console.log('getResidentsBySiteService - site_id (String) ile aranıyor:', siteIdParam);
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
  
  console.log('getResidentsBySiteService - Final siteId (Int):', siteId);
  
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

  console.log('getResidentsBySiteService - Bulunan sakin sayısı:', residents.length);

  // block_name'i düz alana dönüştür
  return residents.map(r => ({
    id: r.id,
    full_name: r.full_name,
    phone_number: r.phone_number,
    block_no: r.blocks?.block_name || '-',
    apartment_no: r.apartment_no || '-'
  }));
}

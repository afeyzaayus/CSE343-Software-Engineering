import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== ÖDEME OLUŞTURMA (Bir kez oluşturulduktan sonra değiştirilemez) =====
export async function createPaymentService(paymentData) {
  const { userId, siteId, amount, payment_date, payment_method, description } = paymentData;

  // Kullanıcının site'ye ait olup olmadığını kontrol et
  const user = await prisma.users.findFirst({
    where: {
      id: userId,
      siteId: siteId
    }
  });

  if (!user) {
    throw new Error('AUTH_ERROR: Kullanıcı bu siteye ait değil.');
  }

  // Ödemeyi oluştur
  const payment = await prisma.payments.create({
    data: {
      userId,
      siteId,
      amount: parseFloat(amount),
      payment_date: new Date(payment_date),
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
export async function getPaymentsBySiteService(siteId, filters = {}) {
  const { startDate, endDate, userId, payment_method } = filters;

  const where = { siteId: parseInt(siteId) };

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
  return payments.map(payment => ({
    ...payment,
    user: {
      id: payment.users.id,
      full_name: payment.users.full_name,
      phone_number: payment.users.phone_number,
      block_no: payment.users.blocks?.block_name || '-',
      apartment_no: payment.users.apartment_no || '-'
    },
    users: undefined
  }));
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
export async function getResidentsBySiteService(siteId) {
  const residents = await prisma.users.findMany({
    where: { siteId: parseInt(siteId) },
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

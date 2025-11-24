import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== ÖDEME OLUŞTURMA (Bir kez oluşturulduktan sonra değiştirilemez) =====
export async function createPaymentService(paymentData) {
  const { userId, siteId, amount, payment_date, payment_method, description } = paymentData;

  // Kullanıcının site'ye ait olup olmadığını kontrol et
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      siteId: siteId
    }
  });

  if (!user) {
    throw new Error('AUTH_ERROR: Kullanıcı bu siteye ait değil.');
  }

  // Ödemeyi oluştur
  const payment = await prisma.payment.create({
    data: {
      userId,
      siteId,
      amount: parseFloat(amount),
      payment_date: new Date(payment_date),
      payment_method,
      description
    },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          block_no: true,
          apartment_no: true
        }
      }
    }
  });

  return payment;
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

  const payments = await prisma.payment.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          phone_number: true,
          block_no: true,
          apartment_no: true
        }
      }
    },
    orderBy: {
      payment_date: 'desc'
    }
  });

  return payments;
}

// ===== TEK BİR ÖDEME DETAYI =====
export async function getPaymentByIdService(paymentId) {
  const payment = await prisma.payment.findUnique({
    where: { id: parseInt(paymentId) },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          phone_number: true,
          block_no: true,
          apartment_no: true
        }
      }
    }
  });

  if (!payment) {
    throw new Error('NOT_FOUND: Ödeme bulunamadı.');
  }

  return payment;
}

// ===== KULLANICININ TÜM ÖDEMELERİ =====
export async function getUserPaymentsService(userId) {
  const payments = await prisma.payment.findMany({
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
  const totalPayments = await prisma.payment.count({ where });

  // Toplam tutar
  const totalAmount = await prisma.payment.aggregate({
    where,
    _sum: {
      amount: true
    }
  });

  // Ödeme yöntemine göre dağılım
  const paymentsByMethod = await prisma.payment.groupBy({
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
  const residents = await prisma.user.findMany({
    where: { siteId: parseInt(siteId) },
    select: {
      id: true,
      full_name: true,
      phone_number: true,
      block_no: true,
      apartment_no: true,
      is_verified: true
    },
    orderBy: [
      { block_no: 'asc' },
      { apartment_no: 'asc' }
    ]
  });

  return residents;
}

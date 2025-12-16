import {
  createPaymentService,
  getPaymentsBySiteService,
  getPaymentByIdService,
  getUserPaymentsService,
  getPaymentStatsService,
  getResidentsBySiteService,
  getMonthlyDuesBySiteService,
  createMonthlyDuesForAllResidentsService,
  recordMonthlyPaymentService,
  getOverdueStatsService
} from '../services/payment.service.js';

// ===== YENİ ÖDEME OLUŞTURMA =====
export async function createPayment(req, res) {
  try {
    const { userId, siteId, amount, payment_date, payment_method, description } = req.body;

    // Validasyon
    if (!userId || !siteId || !amount || !payment_date || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID, Site ID, tutar, ödeme tarihi ve ödeme yöntemi zorunludur.'
      });
    }

    // Tutar kontrolü
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Ödeme tutarı pozitif olmalıdır.'
      });
    }

    const payment = await createPaymentService({
      userId,
      siteId,
      amount,
      payment_date,
      payment_method,
      description
    });

    return res.status(201).json({
      success: true,
      message: 'Ödeme başarıyla kaydedildi.',
      data: payment
    });
  } catch (error) {

    if (error.message.startsWith('AUTH_ERROR')) {
      return res.status(403).json({
        success: false,
        message: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Ödeme kaydedilirken bir hata oluştu.'
    });
  }
}

// ===== SİTE'YE AİT TÜM ÖDEMELERİ GETIRME =====
export async function getPaymentsBySite(req, res) {
  try {
    const { siteId } = req.params;
    
    // Debug: siteId'nin değerini ve tipini kontrol et
    
    // siteId validasyonu
    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: 'Site ID zorunludur.'
      });
    }

    const { startDate, endDate, userId, payment_method } = req.query;

    const payments = await getPaymentsBySiteService(siteId, {
      startDate,
      endDate,
      userId,
      payment_method
    });

    return res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {

    if (error.message.startsWith('VALIDATION_ERROR')) {
      return res.status(400).json({
        success: false,
        message: error.message.replace('VALIDATION_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Ödemeler getirilirken bir hata oluştu.'
    });
  }
}

// ===== TEK BİR ÖDEME DETAYI =====
export async function getPaymentById(req, res) {
  try {
    const { paymentId } = req.params;

    const payment = await getPaymentByIdService(paymentId);

    return res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {

    if (error.message.startsWith('NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('NOT_FOUND: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Ödeme detayı getirilirken bir hata oluştu.'
    });
  }
}

// ===== KULLANICININ ÖDEMELERİ =====
export async function getUserPayments(req, res) {
  try {
    const { userId } = req.params;

    const payments = await getUserPaymentsService(userId);

    return res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Kullanıcı ödemeleri getirilirken bir hata oluştu.'
    });
  }
}

// ===== ÖDEME İSTATİSTİKLERİ =====
export async function getPaymentStats(req, res) {
  try {
    const { siteId } = req.params;
    const { startDate, endDate } = req.query;

    const stats = await getPaymentStatsService(siteId, {
      startDate,
      endDate
    });

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'İstatistikler getirilirken bir hata oluştu.'
    });
  }
}

// ===== SİTE SAKİNLERİNİ GETIRME =====
export async function getResidentsBySite(req, res) {
  try {
    const { siteId } = req.params;
    

    const residents = await getResidentsBySiteService(siteId);
    

    return res.status(200).json({
      success: true,
      data: residents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Site sakinleri getirilirken bir hata oluştu: ' + error.message
    });
  }
}

// ===== AYLIK AIDATLARI GETIRME (Ay ve yıla göre) =====
export async function getMonthlyDuesBySite(req, res) {
  try {
    const { siteId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Ay ve yıl parametreleri zorunludur.'
      });
    }

    const monthlyDues = await getMonthlyDuesBySiteService(siteId, month, year);

    return res.status(200).json({
      success: true,
      data: monthlyDues
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Aylık aidatları getirirken bir hata oluştu: ' + error.message
    });
  }
}

// ===== AYLIK AIDATLARI OLUŞTURMA (Tüm sakinler için) =====
export async function createMonthlyDuesForAllResidents(req, res) {
  try {
    const { siteId, month, year, amount, due_date } = req.body;

    if (!siteId || !month || !year || !amount || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'Site ID, ay, yıl, tutar ve ödeme tarihi zorunludur.'
      });
    }

    const result = await createMonthlyDuesForAllResidentsService(siteId, month, year, amount, due_date);

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Aylık aidatları oluştururken bir hata oluştu: ' + error.message
    });
  }
}

// ===== AYLIK ÖDEME KAYDETME (Manuel ödeme - DAIRE BAZINDA) =====
export async function recordMonthlyPayment(req, res) {
  try {
    const { monthlyDueId, payment_method, paid_by_user_id } = req.body;

    if (!monthlyDueId || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Aidatı ID ve ödeme yöntemi zorunludur.'
      });
    }

    const updated = await recordMonthlyPaymentService(monthlyDueId, payment_method, paid_by_user_id);

    return res.status(200).json({
      success: true,
      message: 'Ödeme başarıyla kaydedildi (daire bazında tüm sakınlar işaretlendi).',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Ödeme kaydedilirken bir hata oluştu: ' + error.message
    });
  }
}

// ===== OVERDUE İSTATİSTİKLERİ =====
export async function getOverdueStats(req, res) {
  try {
    const { siteId } = req.params;

    const stats = await getOverdueStatsService(siteId);

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Overdue istatistikleri getirilirken bir hata oluştu: ' + error.message
    });
  }
}

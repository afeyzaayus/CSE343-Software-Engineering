import {
  createPaymentService,
  getPaymentsBySiteService,
  getPaymentByIdService,
  getUserPaymentsService,
  getPaymentStatsService,
  getResidentsBySiteService
} from '../services/payment.service.js';

// ===== YENİ ÖDEME OLUŞTURMA =====
export async function createPayment(req, res) {
  try {
    const { userId, siteId, amount, payment_date, payment_method, description } = req.body;

    // Debug: Gelen veriyi logla
    console.log('📥 createPayment - Gelen body:', req.body);
    console.log('📥 userId:', userId, 'siteId:', siteId, 'amount:', amount, 'payment_date:', payment_date, 'payment_method:', payment_method);

    // Validasyon
    if (!userId || !siteId || !amount || !payment_date || !payment_method) {
      console.error('❌ Validasyon hatası - Eksik alanlar:', {
        userId: !!userId,
        siteId: !!siteId,
        amount: !!amount,
        payment_date: !!payment_date,
        payment_method: !!payment_method
      });
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
    console.error('Ödeme oluşturma hatası:', error);

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
    console.log('getPaymentsBySite - siteId:', siteId, 'type:', typeof siteId);
    
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
    console.error('Ödemeleri getirme hatası:', error);

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
    console.error('Ödeme detayı hatası:', error);

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
    console.error('Kullanıcı ödemeleri hatası:', error);
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
    console.error('Ödeme istatistikleri hatası:', error);
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
    
    console.log('🏠 getResidentsBySite - siteId:', siteId, 'type:', typeof siteId);

    const residents = await getResidentsBySiteService(siteId);
    
    console.log('✅ Sakinler bulundu - Toplam:', residents.length);

    return res.status(200).json({
      success: true,
      data: residents
    });
  } catch (error) {
    console.error('❌ Site sakinleri hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Site sakinleri getirilirken bir hata oluştu: ' + error.message
    });
  }
}

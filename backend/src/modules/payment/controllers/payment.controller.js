import {
  getResidentsBySiteService,
  getMonthlyDuesBySiteService,
  createMonthlyDuesForAllResidentsService,
  recordMonthlyPaymentService,
  getOverdueStatsService
} from '../services/payment.service.js';

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

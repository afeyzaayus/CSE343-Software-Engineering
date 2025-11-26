import {
  getAllAccountsService,
  updateAccountStatusService,
  getDashboardStatsService,
  getAccountByIdService,
  updateAccountProfileService
} from '../../services/index.js';

// ==================== Tüm Hesapları Getir ====================

/**
 * Tüm hesapları listele (SUPER_ADMIN için)
 * @route   GET /api/accounts
 * @access  Private (SUPER_ADMIN)
 * @query   { status?: string, type?: string, search?: string, deleted?: string }
 */
export async function getAllAccounts(req, res) {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      search: req.query.search,
      deleted: req.query.deleted
    };

    const accounts = await getAllAccountsService(filters);

    return res.status(200).json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    console.error('Get all accounts error:', error);

    return res.status(500).json({
      success: false,
      message: 'Hesaplar getirilirken bir hata oluştu.'
    });
  }
}

// ==================== Hesap Durumunu Güncelle ====================

/**
 * Hesap durumunu güncelle
 * @route   PATCH /api/accounts/:id/status
 * @access  Private (SUPER_ADMIN)
 * @body    { status: string }
 */
export async function updateAccountStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Hesap durumu belirtilmelidir.'
      });
    }

    const result = await updateAccountStatusService(id, status);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.admin
    });
  } catch (error) {
    console.error('Update account status error:', error);

    if (error.message.startsWith('VALIDATION_ERROR:')) {
      return res.status(400).json({
        success: false,
        message: error.message.replace('VALIDATION_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Hesap durumu güncellenirken bir hata oluştu.'
    });
  }
}

// ==================== Dashboard İstatistikleri ====================

/**
 * Dashboard istatistiklerini getir
 * @route   GET /api/accounts/dashboard/stats
 * @access  Private (SUPER_ADMIN)
 */
export async function getDashboardStats(req, res) {
  try {
    const stats = await getDashboardStatsService();

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);

    return res.status(500).json({
      success: false,
      message: 'Dashboard istatistikleri getirilirken bir hata oluştu.'
    });
  }
}

// ==================== Tek Hesap Detayı Getir ====================

/**
 * Hesap detayını getir
 * @route   GET /api/accounts/:id
 * @access  Private (SUPER_ADMIN)
 */
export async function getAccountById(req, res) {
  try {
    const { id } = req.params;
    const account = await getAccountByIdService(id);

    return res.status(200).json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error('Get account by id error:', error);

    if (error.message.startsWith('ACCOUNT_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('ACCOUNT_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Hesap detayı getirilirken bir hata oluştu.'
    });
  }
}

// ==================== Hesap Profilini Güncelle ====================

/**
 * Hesap profilini güncelle
 * @route   PUT /api/accounts/:id
 * @access  Private (SUPER_ADMIN)
 * @body    { full_name?: string, company_name?: string }
 */
export async function updateAccountProfile(req, res) {
  try {
    const { id } = req.params;
    const { full_name, company_name } = req.body;

    if (!full_name && !company_name) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek en az bir alan belirtilmelidir (full_name veya company_name).'
      });
    }

    if (full_name && full_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Ad Soyad en az 2 karakter olmalıdır.'
      });
    }

    const updateData = {};
    if (full_name) updateData.full_name = full_name.trim();
    if (company_name) updateData.company_name = company_name.trim();

    const result = await updateAccountProfileService(id, updateData);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.account
    });
  } catch (error) {
    console.error('Update account profile error:', error);

    if (error.message.startsWith('ACCOUNT_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('ACCOUNT_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Hesap profili güncellenirken bir hata oluştu.'
    });
  }
}
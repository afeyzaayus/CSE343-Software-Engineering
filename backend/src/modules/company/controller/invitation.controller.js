import {
  createEmployeeInvitationService,
  acceptEmployeeInvitationService,
  getCompanyInvitationsService,
  deleteInvitationService, // ✅ Service'i kullanacağız
  verifyEmployeeInvitationService 
} from '../../../index.js';

/**
 * Çalışan davetiyesi oluşturma
 * @route POST /api/company/invitations/create
 */
export const createEmployeeInvitation = async (req, res) => {
  try {
    const managerId = req.admin.id;
    const { invited_email } = req.body;

    console.log('📤 Davet oluşturma isteği:', {
      managerId,
      invited_email
    });

    const result = await createEmployeeInvitationService(managerId, invited_email);

    return res.status(201).json({
      success: true,
      message: 'Davet başarıyla oluşturuldu',
      data: result
    });
  } catch (error) {
    console.error('❌ createEmployeeInvitation controller hatası:', error);
    
    if (error.message.includes('AUTH_ERROR')) {
      return res.status(403).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }
    
    if (error.message.includes('COMPANY_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('COMPANY_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Davet oluşturulurken bir hata oluştu.'
    });
  }
};

/**
 * Çalışan davetini kabul etme (Kayıt olma)
 * @route POST /api/company/invitations/accept
 */
export const acceptEmployeeInvitation = async (req, res) => {
  try {
    const { invite_code, full_name, email, password } = req.body;

    // Validasyon
    if (!invite_code || !full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar zorunludur'
      });
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir email adresi girin'
      });
    }

    // Şifre uzunluğu kontrolü
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Şifre en az 6 karakter olmalıdır'
      });
    }

    console.log('📥 Davet kabul isteği:', {
      invite_code,
      email
    });

    const result = await acceptEmployeeInvitationService({
      invite_code,
      full_name,
      email,
      password
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.admin
    });
  } catch (error) {
    console.error('❌ acceptEmployeeInvitation controller hatası:', error);

    if (error.message.includes('INVITE_ERROR')) {
      return res.status(400).json({
        success: false,
        error: error.message.replace('INVITE_ERROR: ', '')
      });
    }

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(400).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Davet kabul edilirken bir hata oluştu.'
    });
  }
};

/**
 * Şirket davetlerini listele
 * @route GET /api/company/invitations
 */
export const getCompanyInvitations = async (req, res) => {
  try {
    const managerId = req.admin.id;

    console.log('📋 Davetler listeleniyor, managerId:', managerId);

    const invitations = await getCompanyInvitationsService(managerId);

    return res.status(200).json({
      success: true,
      data: {
        invitations
      }
    });
  } catch (error) {
    console.error('❌ getCompanyInvitations controller hatası:', error);

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(403).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    if (error.message.includes('COMPANY_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('COMPANY_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Davetler getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Davet kodunu doğrula
 * @route POST /api/company/invitations/verify
 * @access Public
 */
export const verifyEmployeeInvitation = async (req, res) => {
  try {
    const { invite_code } = req.body;

    if (!invite_code) {
      return res.status(400).json({
        success: false,
        error: 'Davet kodu gereklidir'
      });
    }

    console.log('🔍 Davet kodu doğrulanıyor:', invite_code);

    const invitationData = await verifyEmployeeInvitationService(invite_code);

    if (!invitationData) {
      return res.status(404).json({
        success: false,
        error: 'Davet kodu geçersiz veya bulunamadı'
      });
    }

    return res.status(200).json({
      success: true,
      data: invitationData
    });
  } catch (error) {
    console.error('❌ Davet doğrulama hatası:', error);
    return res.status(500).json({
      success: false,
      error: 'Sunucu hatası: ' + error.message
    });
  }
};

/**
 * Daveti sil
 * @route DELETE /api/company/invitations/:id
 * @access Private (COMPANY_MANAGER)
 */
export const deleteInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ req.admin'den bilgileri al
    console.log('🔍 req.admin:', req.admin);

    const managerId = req.admin?.id;
    const companyId = req.admin?.company_id;

    console.log('🗑️ Davet silme isteği:', { 
      invitationId: id, 
      managerId, 
      companyId 
    });

    // ✅ Bilgileri kontrol et
    if (!managerId) {
      return res.status(401).json({
        success: false,
        error: 'Yetkilendirme bilgisi bulunamadı'
      });
    }

    if (!companyId) {
      console.error('❌ company_id eksik! req.admin:', req.admin);
      return res.status(403).json({
        success: false,
        error: 'Şirket bilgisi bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }

    // ✅ Service'i çağır
    const result = await deleteInvitationService(parseInt(id), companyId);

    console.log('✅ Davet silindi:', result);

    return res.status(200).json({
      success: true,
      message: 'Davet başarıyla silindi',
      data: result
    });

  } catch (error) {
    console.error('❌ Davet silme hatası:', error);

    // Hata mesajlarına göre status code belirle
    if (error.message.includes('bulunamadı') || error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Davet bulunamadı veya bu daveti silme yetkiniz yok'
      });
    }

    if (error.message.includes('AUTH_ERROR') || error.message.includes('yetki')) {
      return res.status(403).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Davet silinirken bir hata oluştu',
      details: error.message
    });
  }
};
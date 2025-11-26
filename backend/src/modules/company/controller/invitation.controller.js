import {
  createEmployeeInvitationService,
  acceptEmployeeInvitationService,
  getCompanyInvitationsService
} from '../../../index.js';

/**
 * @route   POST /api/company/invitations/create
 * @desc    Çalışan davetiyesi oluşturma
 * @access  Private (Company Manager only)
 */
export async function createEmployeeInvitation(req, res) {
  try {
    const managerId = req.admin.id; // Middleware'den gelir
    const { invited_email } = req.body;

    // invited_email opsiyonel - yoksa sadece kod oluşturulur
    const result = await createEmployeeInvitationService(managerId, {
      invited_email: invited_email || null
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: {
        invite_code: result.invite_code,
        invite_link: result.invite_link,
        expires_at: result.expires_at
      }
    });

  } catch (error) {
    console.error('createEmployeeInvitation controller hatası:', error);

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
}

/**
 * @route   POST /api/company/invitations/accept
 * @desc    Çalışan davetini kabul etme (Kayıt olma)
 * @access  Public
 */
export async function acceptEmployeeInvitation(req, res) {
  try {
    const { invite_code, full_name, email, password } = req.body;

    // Validation
    if (!invite_code || !full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar zorunludur.'
      });
    }

    const result = await acceptEmployeeInvitationService(invite_code, {
      full_name,
      email,
      password
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        employeeId: result.employeeId
      }
    });

  } catch (error) {
    console.error('acceptEmployeeInvitation controller hatası:', error);

    if (error.message.includes('INVITE_ERROR')) {
      return res.status(400).json({
        success: false,
        error: error.message.replace('INVITE_ERROR: ', '')
      });
    }

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(409).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Davet kabul edilirken bir hata oluştu.'
    });
  }
}

/**
 * @route   GET /api/company/invitations
 * @desc    Şirket davetlerini listele
 * @access  Private (Company Manager only)
 */
export async function getCompanyInvitations(req, res) {
  try {
    const managerId = req.admin.id; // Middleware'den gelir

    const invitations = await getCompanyInvitationsService(managerId);

    return res.status(200).json({
      success: true,
      message: 'Davetler başarıyla getirildi.',
      data: {
        invitations,
        total: invitations.length
      }
    });

  } catch (error) {
    console.error('getCompanyInvitations controller hatası:', error);

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
}
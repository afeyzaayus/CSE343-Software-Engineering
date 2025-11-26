import {
  forgotUserPasswordService,
  resetUserPasswordService,
  forgotAdminPasswordService,
  resetAdminPasswordService,
  setNewPasswordService
} from '../../services/index.js';

/**
 * @route   POST /api/auth/password-reset/user/forgot-password
 * @desc    Mobil kullanıcı şifre sıfırlama talebi (SMS kodu gönder)
 * @access  Public
 */
export async function forgotUserPassword(req, res) {
  try {
    const { phone_number, site_id } = req.body;

    // Validation
    if (!phone_number || !site_id) {
      return res.status(400).json({
        success: false,
        error: 'Telefon numarası ve Site ID zorunludur.'
      });
    }

    const result = await forgotUserPasswordService(phone_number, site_id);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        userId: result.userId
      }
    });

  } catch (error) {
    console.error('forgotUserPassword controller hatası:', error);

    if (error.message.includes('USER_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('USER_ERROR: ', '')
      });
    }

    if (error.message.includes('VALIDATION_ERROR')) {
      return res.status(400).json({
        success: false,
        error: error.message.replace('VALIDATION_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Şifre sıfırlama kodu gönderilirken bir hata oluştu.'
    });
  }
}

/**
 * @route   POST /api/auth/password-reset/user/reset-password
 * @desc    Mobil kullanıcı şifre sıfırlama (SMS kodu ile)
 * @access  Public
 */
export async function resetUserPassword(req, res) {
  try {
    const { phone_number, code, new_password, password_confirm } = req.body;

    // Validation
    if (!phone_number || !code || !new_password || !password_confirm) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar zorunludur.'
      });
    }

    const result = await resetUserPasswordService(
      phone_number,
      code,
      new_password,
      password_confirm
    );

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('resetUserPassword controller hatası:', error);

    if (error.message.includes('USER_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('USER_ERROR: ', '')
      });
    }

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(401).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    if (error.message.includes('VALIDATION_ERROR')) {
      return res.status(400).json({
        success: false,
        error: error.message.replace('VALIDATION_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Şifre sıfırlanırken bir hata oluştu.'
    });
  }
}

/**
 * @route   POST /api/auth/password-reset/admin/forgot-password
 * @desc    Admin şifre sıfırlama talebi (E-posta linki gönder)
 * @access  Public
 */
export async function forgotAdminPassword(req, res) {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'E-posta adresi zorunludur.'
      });
    }

    const result = await forgotAdminPasswordService(email);

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('forgotAdminPassword controller hatası:', error);

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Şifre sıfırlama e-postası gönderilirken bir hata oluştu.'
    });
  }
}

/**
 * @route   POST /api/auth/password-reset/admin/reset-password
 * @desc    Admin şifre sıfırlama (Token ile)
 * @access  Public
 */
export async function resetAdminPassword(req, res) {
  try {
    const { token, new_password, password_confirm } = req.body;

    // Validation
    if (!token || !new_password || !password_confirm) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar zorunludur.'
      });
    }

    const result = await resetAdminPasswordService(
      token,
      new_password,
      password_confirm
    );

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('resetAdminPassword controller hatası:', error);

    if (error.message.includes('TOKEN_ERROR')) {
      return res.status(401).json({
        success: false,
        error: error.message.replace('TOKEN_ERROR: ', '')
      });
    }

    if (error.message.includes('VALIDATION_ERROR')) {
      return res.status(400).json({
        success: false,
        error: error.message.replace('VALIDATION_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Şifre sıfırlanırken bir hata oluştu.'
    });
  }
}

/**
 * @route   POST /api/auth/password-reset/set-new-password
 * @desc    Giriş yapmış kullanıcı için şifre değiştirme
 * @access  Private (Token gerekli)
 */
export async function setNewPassword(req, res) {
  try {
    const userId = req.user?.id || req.admin?.id; // Middleware'den gelir
    const userType = req.user ? 'user' : 'admin'; // user veya admin
    const { current_password, new_password, password_confirm } = req.body;

    // Validation
    if (!current_password || !new_password || !password_confirm) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar zorunludur.'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Yetkilendirme gerekli.'
      });
    }

    const result = await setNewPasswordService(
      userId,
      userType,
      current_password,
      new_password,
      password_confirm
    );

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('setNewPassword controller hatası:', error);

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(401).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    if (error.message.includes('VALIDATION_ERROR')) {
      return res.status(400).json({
        success: false,
        error: error.message.replace('VALIDATION_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Şifre değiştirilirken bir hata oluştu.'
    });
  }
}
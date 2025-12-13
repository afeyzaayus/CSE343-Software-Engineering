import {
  initiatePasswordSetupService,
  setPasswordWithCodeService,
  loginUserService
} from '../../../../src/index.js';
import { generateToken } from '../../../utils/jwt.utils.js';

/**
 * @route   POST /api/auth/user/initiate-password-setup
 * @desc    Mobil kullanıcı için şifre belirleme sürecini başlat (SMS kodu gönder)
 * @access  Public
 */
export async function initiatePasswordSetup(req, res) {
  try {
    const { phone_number, site_id } = req.body;

    // Validation
    if (!phone_number || !site_id) {
      return res.status(400).json({
        success: false,
        error: 'Telefon numarası ve Site ID zorunludur.'
      });
    }

    const result = await initiatePasswordSetupService(phone_number, site_id);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        userId: result.userId,
        is_password_set: result.is_password_set
      }
    });

  } catch (error) {
    console.error('initiatePasswordSetup controller hatası:', error);

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
      error: 'Doğrulama kodu gönderilirken bir hata oluştu.'
    });
  }
}

/**
 * @route   POST /api/auth/user/set-password
 * @desc    SMS kodu ile şifre belirleme
 * @access  Public
 */
export async function setPasswordWithCode(req, res) {
  try {
    const { phone_number, code, password, password_confirm } = req.body;

    // Validation
    if (!phone_number || !code || !password || !password_confirm) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar zorunludur.'
      });
    }

    const result = await setPasswordWithCodeService(
      phone_number,
      code,
      password,
      password_confirm
    );

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('setPasswordWithCode controller hatası:', error);

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
      error: 'Şifre belirlenirken bir hata oluştu.'
    });
  }
}

/**
 * @route   POST /api/auth/user/login
 * @desc    Mobil kullanıcı girişi
 * @access  Public
 */
export async function loginUser(req, res) {
  try {
    const { phone_number, password } = req.body;

    // Validation
    if (!phone_number || !password) {
      return res.status(400).json({
        success: false,
        error: 'Telefon numarası ve şifre zorunludur.'
      });
    }

    const userData = await loginUserService({ phone_number, password });

    // JWT token oluştur
    const token = generateToken({
      id: userData.id,
      phone_number: userData.phone_number,
      siteId: userData.site.site_id,
      block_id: userData.block_id,
      role: 'user'
    });

    return res.status(200).json({
      success: true,
      message: 'Giriş başarılı.',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('loginUser controller hatası:', error);

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(401).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Giriş sırasında bir hata oluştu.'
    });
  }
}
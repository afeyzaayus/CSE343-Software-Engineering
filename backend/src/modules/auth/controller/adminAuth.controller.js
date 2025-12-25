import {
  registerIndividualService,
  registerCompanyManagerService,
  loginAdminService,
  changePasswordService
} from '../../../../src/index.js';
import { generateToken } from '../../../utils/jwt.utils.js';
import prisma from '../../../prisma/prismaClient.js';

/**
 * Bireysel admin kaydı
 * @route  POST /api/auth/admin/register/individual
 * @access Public
 */
export async function registerIndividual(req, res) {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur.' });
    }

    const result = await registerIndividualService({ full_name, email, password });

    return res.status(201).json({
      success: true,
      message: 'Kayıt başarılı. Hesabınızı aktifleştirmek için e-postanızı kontrol edin.',
      data: {
        admin: {
          id: result.admin.id,
          name: result.admin.full_name,
          email: result.admin.email,
          account_type: result.admin.account_type,
          account_status: result.admin.account_status,
          is_verified: result.admin.is_verified,
          created_at: result.admin.created_at
        },
        individual: {
          id: result.individual.id,
          account_status: result.individual.account_status,
          expiry_date: result.individual.expiry_date
        },
        emailSent: result.emailSent
      }
    });

  } catch (error) {
    console.error('registerIndividual controller hatası:', error);

    let errorMessage = 'Kayıt sırasında beklenmeyen bir hata oluştu.';
    let statusCode = 500;

    if (error.message.includes('zaten kullanımda') || error.message.includes('EMAIL_EXISTS')) {
      statusCode = 409;
      errorMessage = 'Bu e-posta adresi zaten kayıtlıdır. Lütfen giriş yapın.';
    } else if (error.message.includes('VALIDATION_ERROR')) {
      statusCode = 400;
      errorMessage = error.message.replace('VALIDATION_ERROR: ', '');
    }

    return res.status(statusCode).json({ success: false, message: errorMessage });
  }
}

/**
 * @route   POST /api/auth/admin/register/company-manager
 * @desc    Şirket yöneticisi kaydı
 * @access  Public
 */
export async function registerCompanyManager(req, res) {
  try {
    const { full_name, email, password, company_name, company_code } = req.body;

    // Validasyon
    if (!full_name || !email || !password || !company_name || !company_code) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar zorunludur.'
      });
    }

    const result = await registerCompanyManagerService(req.body);

    return res.status(201).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Şirket yöneticisi kayıt hatası:', error);

    if (error.message.startsWith('AUTH_ERROR:')) {
      return res.status(400).json({
        success: false,
        message: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    if (error.message.startsWith('VALIDATION_ERROR:')) {
      return res.status(400).json({
        success: false,
        message: error.message.replace('VALIDATION_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Kayıt sırasında bir hata oluştu.'
    });
  }
}

/**
 * E-posta doğrulama
 * @route GET /api/auth/admin/verify-email?token=xxx
 * @access Public
 */
export async function verifyEmail(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false, message: 'Token eksik!' });

  try {
    const admin = await prisma.admin.findFirst({ where: { verificationToken: token } });

    if (!admin) return res.status(404).json({ success: false, message: 'Geçersiz veya süresi dolmuş token!' });
    if (admin.is_verified) return sendVerificationSuccessHtml(res, 'E-posta zaten doğrulanmış. Giriş sayfasına yönlendiriliyorsunuz...');

    await prisma.admin.update({
      where: { id: admin.id },
      data: { is_verified: true, verificationToken: null, tokenExpiry: null, last_login: new Date() }
    });

    return sendVerificationSuccessHtml(res, '✅ E-posta adresiniz başarıyla doğrulandı! Giriş sayfasına yönlendiriliyorsunuz...');

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Sunucu hatası! Lütfen daha sonra tekrar deneyin.' });
  }
}

// Yardımcı fonksiyon: HTML ile başarılı doğrulama
function sendVerificationSuccessHtml(res, message) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Doğrulama Başarılı</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f4f4; text-align: center; padding-top: 50px; }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
            h1 { color: #28a745; margin-bottom: 20px; }
            p { color: #555; margin-bottom: 20px; }
            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
        <script>
            setTimeout(() => { window.location.href = '${frontendUrl}/index.html'; }, 2000);
        </script>
    </head>
    <body>
        <div class="container">
            <h1>🎉 Doğrulama Başarılı</h1>
            <p>${message}</p>
            <div class="loader"></div>
            <p style="font-size: 14px; color: #999;">Yönlendirileceksiniz...</p>
        </div>
    </body>
    </html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(htmlContent);
}

/**
 * Admin girişi
 * @route POST /api/auth/admin/login
 * @access Public
 */
export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'E-posta ve şifre zorunludur.' });

    const adminData = await loginAdminService({ email, password });

    let role;
    switch (adminData.account_type) {
      case 'INDIVIDUAL': role = 'INDIVIDUAL'; break;
      case 'COMPANY_MANAGER': role = 'COMPANY_MANAGER'; break;
      case 'COMPANY_EMPLOYEE': role = 'COMPANY_EMPLOYEE'; break;
      default: role = 'ADMIN';
    }

    const token = generateToken({ id: adminData.id, email: adminData.email, account_type: adminData.account_type, role });

    return res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          id: adminData.id,
          name: adminData.full_name,
          role: adminData.account_type,
          company_name: adminData.company_name ?? null,
          company_code: adminData.company_code ?? null
        }
      }
    });

  } catch (error) {
    console.error('loginAdmin controller hatası:', error);

    let errorMessage = 'Giriş sırasında beklenmeyen bir hata oluştu.';
    let statusCode = 500;

    if (error.message.includes('AUTH_ERROR')) {
      statusCode = 401;
      errorMessage = error.message.replace('AUTH_ERROR: ', '');
      if (errorMessage === 'E-posta veya şifre hatalı.') errorMessage = 'E-posta adresi veya şifreniz yanlış. Lütfen kontrol edin.';
    } else if (error.message.includes('NOT_VERIFIED_ERROR')) {
      statusCode = 403;
      errorMessage = 'Hesabınız doğrulanmamış. Lütfen e-postanızı kontrol edin ve doğrulama yapın.';
    }

    return res.status(statusCode).json({ success: false, message: errorMessage });
  }
}

/**
 * Şifre Değiştirme
 * @route PUT /api/auth/change-password
 * @access Private (JWT required)
 */
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validasyon
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Mevcut şifre ve yeni şifre zorunludur.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Yeni şifre en az 6 karakter olmalıdır.'
      });
    }

    // req.admin JWT middleware'den geliyor
    if (!req.admin || !req.admin.id) {
      return res.status(401).json({
        success: false,
        error: 'Yetkilendirme bilgisi bulunamadı.'
      });
    }

    // Service fonksiyonunu çağır
    const result = await changePasswordService(
      req.admin.id,
      currentPassword,
      newPassword
    );

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('changePassword controller hatası:', error);

    let errorMessage = 'Şifre değiştirme sırasında bir hata oluştu.';
    let statusCode = 500;

    if (error.message.includes('AUTH_ERROR')) {
      statusCode = 401;
      errorMessage = error.message.replace('AUTH_ERROR: ', '');
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
}


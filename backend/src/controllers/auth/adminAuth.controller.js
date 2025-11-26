import {
  registerIndividualService,
  registerCompanyManagerService,
  verifyEmailService,
  loginAdminService
} from '../../services/index.js';
import { generateToken } from '../../utils/jwt.utils.js';

/**
 * @route   POST /api/auth/admin/register/individual
 * @desc    Bireysel admin kaydı
 * @access  Public
 */
export async function registerIndividual(req, res) {
  try {
    const { full_name, email, password } = req.body;

    // Validation
    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar zorunludur.'
      });
    }

    const result = await registerIndividualService({ full_name, email, password });

    return res.status(201).json({
      success: true,
      message: 'Kayıt başarılı. Hesabınızı aktifleştirmek için e-postanızı kontrol edin.',
      data: {
        admin: result.admin,
        emailSent: result.emailSent
      }
    });

  } catch (error) {
    console.error('registerIndividual controller hatası:', error);

    if (error.message.includes('zaten kullanımda')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Kayıt sırasında bir hata oluştu.'
    });
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

    // Validation
    if (!full_name || !email || !password || !company_name || !company_code) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar zorunludur.'
      });
    }

    const result = await registerCompanyManagerService({
      full_name,
      email,
      password,
      company_name,
      company_code
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: {
        adminId: result.adminId,
        company_code: result.company_code
      }
    });

  } catch (error) {
    console.error('registerCompanyManager controller hatası:', error);

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(409).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    if (error.message.includes('COMPANY_ERROR')) {
      return res.status(409).json({
        success: false,
        error: error.message.replace('COMPANY_ERROR: ', '')
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
      error: 'Kayıt sırasında bir hata oluştu.'
    });
  }
}

/**
 * @route   GET /api/auth/admin/verify-email?token=xxx
 * @desc    E-posta doğrulama
 * @access  Public
 */
export async function verifyEmail(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Doğrulama token\'ı gerekli.'
      });
    }

    const admin = await verifyEmailService(token);

    // Frontend'e yönlendirme için HTML response
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>E-posta Doğrulandı</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
          }
          .success-icon {
            font-size: 60px;
            color: #4CAF50;
            margin-bottom: 20px;
          }
          h1 { color: #333; margin-bottom: 10px; }
          p { color: #666; margin-bottom: 30px; }
          .btn {
            background: #667eea;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            text-decoration: none;
            display: inline-block;
            cursor: pointer;
          }
          .btn:hover { background: #5568d3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>E-posta Doğrulandı!</h1>
          <p>Hesabınız başarıyla aktifleştirildi. Artık giriş yapabilirsiniz.</p>
          <a href="${process.env.FRONTEND_URL}/login" class="btn">Giriş Yap</a>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('verifyEmail controller hatası:', error);

    if (error.message.includes('TOKEN_INVALID')) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Doğrulama Hatası</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            .error-icon {
              font-size: 60px;
              color: #f44336;
              margin-bottom: 20px;
            }
            h1 { color: #333; margin-bottom: 10px; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">✗</div>
            <h1>Doğrulama Başarısız</h1>
            <p>Doğrulama linki geçersiz veya süresi dolmuş.</p>
          </div>
        </body>
        </html>
      `);
    }

    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hata</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
          }
          .error-icon {
            font-size: 60px;
            color: #f44336;
            margin-bottom: 20px;
          }
          h1 { color: #333; margin-bottom: 10px; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">⚠</div>
          <h1>Bir Hata Oluştu</h1>
          <p>E-posta doğrulama sırasında bir hata oluştu.</p>
        </div>
      </body>
      </html>
    `);
  }
}

/**
 * @route   POST /api/auth/admin/login
 * @desc    Admin girişi
 * @access  Public
 */
export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'E-posta ve şifre zorunludur.'
      });
    }

    const adminData = await loginAdminService({ email, password });

    // JWT token oluştur
    const token = generateToken({
      id: adminData.id,
      email: adminData.email,
      account_type: adminData.account_type,
      role: 'admin'
    });

    return res.status(200).json({
      success: true,
      message: 'Giriş başarılı.',
      data: {
        admin: adminData,
        token
      }
    });

  } catch (error) {
    console.error('loginAdmin controller hatası:', error);

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
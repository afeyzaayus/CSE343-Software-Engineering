// middleware/adminAuth.middleware.js
import jwt from 'jsonwebtoken';
import prisma from '../../../prisma/prismaClient.js';

/**
 * Token doğrulama middleware
 */
export const verifyAdminToken = async (req, res, next) => {
  try {
    // Token'ı header'dan al
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token bulunamadı. Lütfen giriş yapın.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('🔍 Token decoded:', decoded);

    // ✅ Admin bilgilerini database'den al (company_id dahil)
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        account_type: true,
        companyId: true, // ✅ Prisma schema'daki alan adı
        company_code: true,
        company_name: true,
        account_status: true
      }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    if (admin.account_status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Hesabınız aktif değil'
      });
    }

    // ✅ req.admin nesnesini düzgün şekilde oluştur
    req.admin = {
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name,
      account_type: admin.account_type,
      company_id: admin.companyId, // ✅ Prisma'dan gelen companyId'yi company_id olarak ekle
      company_code: admin.company_code,
      company_name: admin.company_name
    };

    console.log('✅ req.admin oluşturuldu:', req.admin);

    next();
  } catch (error) {
    console.error('❌ Token doğrulama hatası:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Token doğrulama hatası'
    });
  }
};

/**
 * Company Manager yetkisi kontrolü
 */
export const requireCompanyManager = (req, res, next) => {
  console.log('🔐 requireCompanyManager middleware çalıştı');
  console.log('👤 req.admin:', req.admin);

  if (!req.admin) {
    console.error('❌ req.admin yok!');
    return res.status(401).json({
      success: false,
      error: 'Yetkilendirme bilgisi bulunamadı'
    });
  }

  if (req.admin.account_type !== 'COMPANY_MANAGER') {
    console.error('❌ Yetki yok:', req.admin.account_type);
    return res.status(403).json({
      success: false,
      error: 'Bu işlem için Şirket Yöneticisi yetkisi gereklidir'
    });
  }

  if (!req.admin.company_id) {
    console.error('❌ company_id yok!');
    return res.status(403).json({
      success: false,
      error: 'Şirket bilgisi bulunamadı'
    });
  }

  console.log('✅ Yetki kontrolü başarılı');
  next();
};


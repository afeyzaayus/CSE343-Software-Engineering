// middleware/adminAuth.middleware.js
import jwt from 'jsonwebtoken';
import prisma from '../../../prisma/prismaClient.js';

/**
 * Admin token doğrulama middleware
 */
export async function verifyAdminToken(req, res, next) {
  try {
    // Token'ı farklı yerlerden almayı dene
    let token = req.headers.authorization?.split(' ')[1]; // "Bearer TOKEN"
    
    if (!token) {
      token = req.headers.authorization; // Sadece "TOKEN"
    }
    
    if (!token) {
      token = req.cookies?.adminToken; // Cookie'den
    }

    console.log('🔍 Token kontrol:', {
      authorization: req.headers.authorization,
      cookie: req.cookies?.adminToken,
      token: token ? 'Bulundu' : 'Bulunamadı'
    });

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Yetkilendirme token\'ı bulunamadı.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', decoded);
    
    // Admin kontrolü - companyId CAMELCASE!
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        account_type: true,
        account_status: true,
        is_verified: true,
        deleted_at: true,
        companyId: true,  // ← CAMELCASE!
        company: {
          select: {
            id: true,
            company_name: true,
            company_code: true
          }
        }
      }
    });

    console.log('🔍 Admin sorgusu:', admin);

    if (!admin || admin.deleted_at) {
      return res.status(401).json({ 
        success: false,
        error: 'Geçersiz token.' 
      });
    }

    if (admin.account_status !== 'ACTIVE') {
      return res.status(403).json({ 
        success: false,
        error: 'Hesabınız aktif değil.' 
      });
    }

    if (!admin.is_verified) {
      return res.status(403).json({ 
        success: false,
        error: 'E-posta doğrulaması yapılmamış.' 
      });
    }

    // Request'e admin bilgisini ekle
    req.admin = {
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name,
      account_type: admin.account_type,
      companyId: admin.companyId,  // ← CAMELCASE!
      company: admin.company
    };

    console.log('👤 Admin authenticated:', req.admin);

    next();
  } catch (error) {
    console.error('❌ Token verification error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Geçersiz token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token süresi dolmuş.' 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Token doğrulama hatası.' 
    });
  }
}

/**
 * Sadece COMPANY_MANAGER yetkisi kontrolü
 */
export function requireCompanyManager(req, res, next) {
  if (req.admin.account_type !== 'COMPANY_MANAGER') {
    return res.status(403).json({ 
      success: false,
      error: 'Bu işlem için şirket yöneticisi olmalısınız.' 
    });
  }
  next();
}

/**
 * Sadece INDIVIDUAL veya COMPANY_MANAGER
 */
export function requireAdminAccess(req, res, next) {
  if (!['INDIVIDUAL', 'COMPANY_MANAGER'].includes(req.admin.account_type)) {
    return res.status(403).json({ 
      success: false,
      error: 'Yetkisiz erişim.' 
    });
  }
  next();
}
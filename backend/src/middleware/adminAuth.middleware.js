// middleware/adminAuth.middleware.js
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

/**
 * Admin token doğrulama middleware
 */
export async function verifyAdminToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // "Bearer TOKEN"
    
    if (!token) {
      return res.status(401).json({ error: 'Yetkilendirme token\'ı bulunamadı.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Admin kontrolü
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        account_type: true,
        account_status: true,
        is_verified: true,
        deleted_at: true
      }
    });

    if (!admin || admin.deleted_at) {
      return res.status(401).json({ error: 'Geçersiz token.' });
    }

    if (admin.account_status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Hesabınız aktif değil.' });
    }

    if (!admin.is_verified) {
      return res.status(403).json({ error: 'E-posta doğrulaması yapılmamış.' });
    }

    req.admin = admin; // Request'e admin bilgisini ekle
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Geçersiz token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token süresi dolmuş.' });
    }
    return res.status(500).json({ error: 'Token doğrulama hatası.' });
  }
}

/**
 * Sadece COMPANY_MANAGER yetkisi kontrolü
 */
export function requireCompanyManager(req, res, next) {
  if (req.admin.account_type !== 'COMPANY_MANAGER') {
    return res.status(403).json({ error: 'Bu işlem için şirket yöneticisi olmalısınız.' });
  }
  next();
}

/**
 * Sadece INDIVIDUAL veya COMPANY_MANAGER
 */
export function requireAdminAccess(req, res, next) {
  if (!['INDIVIDUAL', 'COMPANY_MANAGER'].includes(req.admin.account_type)) {
    return res.status(403).json({ error: 'Yetkisiz erişim.' });
  }
  next();
}
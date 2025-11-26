// middleware/userAuth.middleware.js
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

/**
 * User (mobil kullanıcı) token doğrulama middleware
 */
export async function verifyUserToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Yetkilendirme token\'ı bulunamadı.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // User kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        phone_number: true,
        full_name: true,
        siteId: true,
        block_id: true,
        account_status: true,
        is_password_set: true,
        deleted_at: true
      }
    });

    if (!user || user.deleted_at) {
      return res.status(401).json({ error: 'Geçersiz token.' });
    }

    if (user.account_status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Hesabınız aktif değil.' });
    }

    if (!user.is_password_set) {
      return res.status(403).json({ error: 'Lütfen önce şifrenizi belirleyin.' });
    }

    req.user = user; // Request'e user bilgisini ekle
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
 * Site erişim kontrolü - user'ın kendi sitesine erişimi
 */
export function verifySiteAccess(req, res, next) {
  const siteId = req.params.siteId || req.body.siteId;
  
  if (req.user.siteId !== parseInt(siteId)) {
    return res.status(403).json({ error: 'Bu site için yetkiniz yok.' });
  }
  
  next();
}
// src/middlewares/verifyMaster.middleware.js
import jwt from 'jsonwebtoken';
import prisma from '../../../prisma/prismaClient.js';

/**
 * 🔐 Master Admin Token Doğrulama (Base Middleware)
 * — Bu middleware sadece:
 *      ✔ Token doğrular
 *      ✔ Master user'ı DB'den bulur
 *      ✔ Silinmiş / aktif değil / doğrulanmamış kontrolleri yapar
 *      ✔ req.master içine kullanıcıyı koyar
 */
export async function verifyMaster(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token bulunamadı. Lütfen giriş yapın.'
      });
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Geçersiz token.'
      });
    }

    // DB'den Master Kullanıcıyı Çek
    const master = await prisma.masterUser.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        master_role: true,
        is_active: true,
        is_verified: true,
        deleted_at: true
      }
    });

    if (!master) {
      return res.status(403).json({
        success: false,
        message: 'Geçersiz kullanıcı.'
      });
    }

    if (master.deleted_at) {
      return res.status(403).json({
        success: false,
        message: 'Bu hesap silinmiş.'
      });
    }

    if (!master.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız aktif değil.'
      });
    }

    if (!master.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'E-postanız doğrulanmamış.'
      });
    }

    // Kullanıcı artık doğrulanmış → request'e ekle (req.user olarak)
    req.user = master;
    next();

  } catch (err) {
    console.error('verifyMaster middleware hatası:', err);
    return res.status(500).json({
      success: false,
      message: 'Kimlik doğrulama hatası.',
      error: err.message
    });
  }
}



/**
 * 🔐 MASTER_ADMIN Rolü Gerektiren İşlemler İçin Middleware
 */
export async function verifyMasterAdmin(req, res, next) {
  // DÜZELTME: verifyMaster'ı await ile çağır veya callback kullan
  await verifyMaster(req, res, () => {
    if (!req.user) return; // verifyMaster zaten hata döndürdü
    
    if (req.user.master_role !== 'MASTER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için MASTER_ADMIN yetkisi gereklidir.'
      });
    }
    next();
  });
}



/**
 * 🔐 Birden Fazla Rol İçin Yetki Kontrolü
 * Örnek kullanım:
 *   router.post('/x', verifyMasterRole('MASTER_ADMIN', 'DEVELOPER'), ...)
 */
export function verifyMasterRole(...roles) {
  return async (req, res, next) => {
    await verifyMaster(req, res, () => {
      if (!req.user) return; // verifyMaster zaten hata döndürdü
      
      if (!roles.includes(req.user.master_role)) {
        return res.status(403).json({
          success: false,
          message: `Bu işlem için ${roles.join(' veya ')} yetkisi gereklidir.`
        });
      }
      next();
    });
  };
}
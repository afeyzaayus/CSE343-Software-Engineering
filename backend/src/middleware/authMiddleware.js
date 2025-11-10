import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET;
export const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION;


export const adminAuth = async (req, res, next) => {
    let token;

    // 1. Token'ı Header'dan Al (Authorization: Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Token'ı "Bearer " kısmından ayır
            token = req.headers.authorization.split(' ')[1];

            // 2. Token'ı Doğrula
            const decoded = jwt.verify(token, JWT_SECRET);

            // 3. Admin Rolü Kontrolü (opsiyonel ama iyi bir pratik)
            if (decoded.role !== 'admin') {
                return res.status(403).json({ message: 'Yetkisiz erişim: Bu işlem için Admin yetkisi gereklidir.' });
            }

            // 4. Admin'i Veritabanından Bul ve req'e Ekle
            // Bu, Admin'in hala var olup olmadığını ve hesap tipini kontrol eder
            const admin = await prisma.admin.findUnique({
                where: { id: decoded.id },
                select: { id: true, account_type: true } // Sadece gerekli alanları çek
            });

            if (!admin) {
                return res.status(401).json({ message: 'Yetkilendirme Başarısız: Admin bulunamadı.' });
            }

            // Admin bilgilerini (id ve account_type) req nesnesine ekle
            req.admin = admin;

            next(); // Sonraki controller'a geç

        } catch (error) {
            console.error('JWT Doğrulama Hatası:', error.message);
            return res.status(401).json({ message: 'Yetkilendirme Başarısız: Token geçersiz veya süresi dolmuş.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Yetkilendirme Başarısız: Token sağlanmadı.' });
    }
};

// middleware/authMiddleware.js

export function userAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token bulunamadı' });

    // Token doğrulama (örnek: JWT kullanıyorsan)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || decoded.role !== 'USER') {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }

    req.user = { id: decoded.id, role: decoded.role }; // userId ve rolü ekle
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz token' });
  }
};

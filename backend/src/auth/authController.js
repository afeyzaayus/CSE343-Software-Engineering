import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


import { validationResult } from 'express-validator';
import { 
    registerAdminService, 
    createSiteService, 
    registerUserService,
    loginUserService,  
    loginAdminService
} from './authService.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET;
export const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION;

export const userRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const newUser = await registerUserService(req.body);
    res.status(201).json({
      message: 'Kullanıcı kaydı başarıyla tamamlandı.',
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
    console.error(error);
  }
};
export const loginUser = async (req, res) => {
    // Telefon numarası ve şifreye ihtiyacımız var
    const { phone_number, password } = req.body; 

    // Basit alan doğrulama
    if (!phone_number || !password) {
        return res.status(400).json({ message: 'Telefon numarası ve şifre zorunludur.' });
    }

    try {
        // Servis çağrısı
        const user = await loginUserService({ phone_number, password });
        // Başarılı giriş

        const token = jwt.sign(
            { id: user.id, email: user.email, role: 'user' },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRATION }
        );

        // Burada bir JWT token oluşturup göndermek idealdir, ancak sadece kullanıcı verilerini döndürüyoruz.
        res.status(200).json({
            message: 'Kullanıcı girişi başarılı.',
            user: user,
            token: token
        });

    } catch (error) {
        console.error('Kullanıcı giriş hatası:', error.message);
        
        let status = 500;
        // Servisimizdeki tek hata türü AUTH_ERROR (hatalı kimlik bilgisi)
        if (error.message.includes('AUTH_ERROR')) status = 401; // Yetkisiz/Hatalı kimlik bilgisi
        
        res.status(status).json({ message: 'Giriş Başarısız: ' + error.message });
    }
};

export const registerAdmin = async (req, res) => {
    const { full_name, email, password, account_type, company_name } = req.body;

    // --- BASİT ALAN DOĞRULAMA ---
    if (!full_name || !email || !password || !account_type) {
        return res.status(400).json({ message: 'Tüm zorunlu alanları doldurun (Ad, e-posta, şifre, hesap türü).' });
    }
    
    // Hesap türüne özgü doğrulama
    if (account_type === 'COMPANY' && !company_name) {
        return res.status(400).json({ message: 'Şirket hesabı için şirket adı gereklidir.' });
    }
    if (account_type === 'INDIVIDUAL' && company_name) {
         return res.status(400).json({ message: 'Bireysel hesap için şirket adı girmeyin.' });
    }

    try {
        // --- SERVİS ÇAĞRISI ---
        const newAdmin = await registerAdminService({
            full_name,
            email,
            password,
            account_type,
            company_name
        });

        const token = jwt.sign(
            { id: newAdmin.id, email: newAdmin.email, role: 'admin' },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRATION }
        );

        // --- BAŞARILI YANIT ---
        res.status(201).json({
            message: 'Admin kaydı başarılı. Site oluşturma sayfasına yönlendiriliyorsunuz.',
            admin: newAdmin,
            token: token
        });

    } catch (error) {
        // --- HATA YÖNETİMİ ---
        console.error('Admin kayıt hatası:', error.message);
        
        let status = 500;
        // Service'den gelen özel hata mesajlarını kullanarak durum kodu belirleme
        if (error.message.includes('AUTH_ERROR')) status = 409; // Çakışma (E-posta zaten kayıtlı)

        res.status(status).json({ message: error.message });
    }
};
// ===== YÖNETİCİ GİRİŞİ (loginAdmin) =====
export const loginAdmin = async (req, res) => {
    // E-posta ve şifreye ihtiyacımız var
    const { email, password } = req.body;

    // Basit alan doğrulama
    if (!email || !password) {
        return res.status(400).json({ message: 'E-posta ve şifre zorunludur.' });
    }

    try {
        // Servis çağrısı
        const admin = await loginAdminService({ email, password });

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: 'admin' },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRATION }
        );

        // Başarılı giriş
        // Burada bir JWT token oluşturup göndermek idealdir, ancak sadece admin verilerini döndürüyoruz.
        res.status(200).json({
            message: 'Yönetici girişi başarılı.',
            admin: admin,
            token: token
        });

    } catch (error) {
        console.error('Yönetici giriş hatası:', error.message);
        
        let status = 500;
        // Servisimizdeki tek hata türü AUTH_ERROR (hatalı kimlik bilgisi)
        if (error.message.includes('AUTH_ERROR')) status = 401; // Yetkisiz/Hatalı kimlik bilgisi
        
        res.status(status).json({ message: 'Giriş Başarısız: ' + error.message });
    }
};
export const createSite = async (req, res) => {
    // Admin ID'si token/session middleware'inden gelir (authMiddleware tarafından set edildiği varsayılır).
    // Örn: req.admin = { id: 1, ... };
    const adminId = req.admin ? req.admin.id : null; 
    const account_type = req.admin ? req.admin.account_type : null;

    
    const { site_id, site_name, site_address } = req.body;

    // --- BASİT ALAN DOĞRULAMA ---
    if (!site_id || !site_name || !site_address) {
        return res.status(400).json({ message: 'Tüm site alanlarını doldurun (Site ID, Adı, Adresi).' });
    }
    if (!adminId) {
        // Bu hata normalde middleware'den önce yakalanır, ama yine de kontrol edelim.
        return res.status(401).json({ message: 'Oturum açmış Admin bulunamadı veya token geçersiz.' });
    }

    if (!site_id || !site_name || !site_address) {
        return res.status(400).json({ message: 'Tüm site alanlarını doldurun (Site ID, Adı, Adresi).' });
    }
    try {
        // --- SERVİS ÇAĞRISI ---
        const newSite = await createSiteService(adminId, {
            site_id,
            site_name,
            site_address
        });

        // --- BAŞARILI YANIT ---
        res.status(201).json({
            message: 'Site başarıyla oluşturuldu.',
            site: newSite
        });

    } catch (error) {
        // --- HATA YÖNETİMİ ---
        console.error('Site oluşturma hatası:', error.message);
        
        let status = 500;
        // Hata türüne göre HTTP kodu dönme
        if (error.message.includes('LIMIT_EXCEEDED')) status = 403; // Yasak (Limit aşıldı)
        else if (error.message.includes('SITE_ERROR')) status = 409; // Çakışma (Site ID kullanılıyor)
        else if (error.message.includes('AUTH_ERROR')) status = 404; // Admin bulunamadı

        res.status(status).json({ message: error.message });
    }
};
export const getSitesByAdmin = async (req, res) => {
    const adminId = req.admin ? req.admin.id : null;

    if (!adminId) {
        return res.status(401).json({ message: 'Oturum açmış Admin bulunamadı veya token geçersiz.' });
    }

    try {
        // --- SERVİS ÇAĞRISI ---
        const sites = await prisma.site.findMany({
            where: { adminId } // Prisma modelindeki alanın adı adminId olmalı
        });

        res.status(200).json({
            message: 'Admin’e ait siteler başarıyla listelendi.',
            sites
        });

    } catch (error) {
        console.error('Site listeleme hatası:', error.message);
        res.status(500).json({ message: 'Siteler alınamadı.', error: error.message });
    }
};
export const registerUser = async (req, res) => {
    const { full_name, email, phone_number, password, site_id, block_no, apartment_no } = req.body;

    // --- BASİT ALAN DOĞRULAMA ---
    if (!full_name || !email || !password || !site_id) {
        return res.status(400).json({ message: 'Zorunlu kullanıcı alanlarını doldurun (Ad, e-posta, şifre, Site ID).' });
    }

    try {
        // --- SERVİS ÇAĞRISI ---
        const newUser = await registerUserService({
            full_name,
            email,
            phone_number,
            password,
            site_id,
            block_no,
            apartment_no
        });

        // --- BAŞARILI YANIT ---
        res.status(201).json({
            message: 'Kullanıcı kaydı başarıyla oluşturuldu ve siteye bağlandı.',
            user: newUser
        });

    } catch (error) {
        // --- HATA YÖNETİMİ ---
        console.error('Kullanıcı kayıt hatası:', error.message);
        
        let status = 500;
        // Hata türüne göre HTTP kodu dönme
        if (error.message.includes('AUTH_ERROR')) status = 409; // Çakışma (E-posta zaten kayıtlı)
        else if (error.message.includes('USER_ERROR')) status = 404; // Site bulunamadı

        res.status(status).json({ message: error.message });
    }
};
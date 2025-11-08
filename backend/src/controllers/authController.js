import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { 
  registerAdminService, 
  createSiteService, 
  registerUserService,
  loginUserService,  
  loginAdminService,
  verifyEmailService,
  verifyPhoneService,
  forgotAdminPasswordService, 
  resetAdminPasswordService, 
  setNewPasswordService,
  forgotUserPasswordService,
  resetUserPasswordService
} from '../services/authService.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export const JWT_SECRET = process.env.JWT_SECRET;
export const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '24h';
export const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { full_name, phone_number, password, site_id, block_no, apartment_no } = req.body;

  if (!full_name || !phone_number || !password || !site_id) {
    return res.status(400).json({ message: 'Zorunlu kullanıcı alanlarını doldurun (Ad, Telefon, Şifre, Site ID).' });
  }

  try {
    const result = await registerUserService({
      full_name,
      phone_number,
      password,
      site_id,
      block_no,
      apartment_no
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Kullanıcı kayıt hatası:', error.message);
    
    let status = 500;
    if (error.message.includes('AUTH_ERROR')) status = 409;
    else if (error.message.includes('USER_ERROR')) status = 404;

    res.status(status).json({ message: error.message });
  }
};

// ===== TELEFON DOĞRULAMA =====
export const verifyPhone = async (req, res) => {
  const { phone_number, code } = req.body;

  if (!phone_number || !code) {
    return res.status(400).json({ message: 'Telefon numarası ve doğrulama kodu zorunludur.' });
  }

  try {
    const result = await verifyPhoneService(phone_number, code);
    res.status(200).json(result);
  } catch (error) {
    console.error('Telefon doğrulama hatası:', error.message);

    let status = 500;
    if (error.message.includes('AUTH_ERROR') || error.message.includes('USER_ERROR')) status = 400;

    res.status(status).json({ message: error.message });
  }
};

// ===== KULLANICI GİRİŞİ =====
export const loginUser = async (req, res) => {
  const { phone_number, password } = req.body;

  if (!phone_number || !password) {
    return res.status(400).json({ message: 'Telefon numarası ve şifre zorunludur.' });
  }

  try {
    const user = await loginUserService({ phone_number, password });

    const token = jwt.sign(
      { id: user.id, phone_number: user.phone_number, role: 'user' },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    res.status(200).json({
      message: 'Kullanıcı girişi başarılı.',
      user,
      token
    });
  } catch (error) {
    console.error('Kullanıcı giriş hatası:', error.message);
    
    let status = 500;
    if (error.message.includes('AUTH_ERROR')) status = 401;
    
    res.status(status).json({ message: error.message });
  }
};

// ===== USER ŞİFREMİ UNUTTUM =====
export const forgotUserPassword = async (req, res) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({ message: 'Telefon numarası gereklidir.' });
  }

  try {
    const result = await forgotUserPasswordService(phone_number);
    res.status(200).json(result);
  } catch (error) {
    console.error('Şifre sıfırlama kodu hatası:', error.message);

    let status = 500;
    if (error.message.includes('SMS_ERROR')) status = 400;

    res.status(status).json({ message: error.message });
  }
};

// ===== USER YENİ ŞİFRE BELİRLEME =====
export const resetUserPassword = async (req, res) => {
  const { phone_number, code, newPassword, confirmPassword } = req.body;

  if (!phone_number || !code || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Tüm alanları doldurun.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Şifreler eşleşmiyor.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır.' });
  }

  try {
    const result = await resetUserPasswordService(phone_number, code, newPassword);
    res.status(200).json(result);
  } catch (error) {
    console.error('Yeni şifre belirleme hatası:', error.message);

    let status = 500;
    if (error.message.includes('AUTH_ERROR') || error.message.includes('USER_ERROR')) status = 400;

    res.status(status).json({ message: error.message });
  }
};


// ===== ADMIN KAYDI =====
export const registerAdmin = async (req, res) => {
  const { full_name, email, password, account_type, company_name } = req.body;

  // Basit alan doğrulama
  if (!full_name || !email || !password || !account_type) {
    return res.status(400).json({ message: 'Tüm zorunlu alanları doldurun (Ad, e-posta, şifre, hesap türü).' });
  }
  
  if (account_type === 'COMPANY' && !company_name) {
    return res.status(400).json({ message: 'Şirket hesabı için şirket adı gereklidir.' });
  }

  if (account_type === 'INDIVIDUAL' && company_name) {
    return res.status(400).json({ message: 'Bireysel hesap için şirket adı girmeyin.' });
  }

  try {
    const result = await registerAdminService({
      full_name,
      email,
      password,
      account_type,
      company_name
    });

    res.status(201).json({
      message: 'Kayıt başarılı! Lütfen e-posta adresinize gönderilen doğrulama linkine tıklayarak hesabınızı aktifleştirin.',
      email: email
    });
  } catch (error) {
    console.error('Admin kayıt hatası:', error.message);
    
    let status = 500;
    if (error.message.includes('AUTH_ERROR')) status = 409;

    res.status(status).json({ message: error.message });
  }
};

// ===== E-POSTA DOĞRULAMA =====
export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Doğrulama token\'ı bulunamadı.' });
  }

  try {
    const admin = await verifyEmailService(token);

    // JWT token oluştur
    const authToken = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    res.status(200).json({
      message: 'E-posta başarıyla doğrulandı! Hesabınız aktif edildi.'
    });
  } catch (error) {
    console.error('E-posta doğrulama hatası:', error.message);
    
    let status = 500;
    if (error.message.includes('TOKEN_INVALID')) status = 400;
    
    res.status(status).json({ message: error.message });
  }
};

// ===== ADMIN GİRİŞİ =====
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-posta ve şifre zorunludur.' });
  }

  try {
    const admin = await loginAdminService({ email, password });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    res.status(200).json({
      message: 'Yönetici girişi başarılı.',
      admin: admin,
      token: token
    });
  } catch (error) {
    console.error('Yönetici giriş hatası:', error.message);
    
    let status = 500;
    if (error.message.includes('AUTH_ERROR')) status = 401;
    
    res.status(status).json({ message: error.message });
  }
};
export const forgotAdminPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'E-posta adresi gereklidir.' });
    }

    const result = await forgotAdminPasswordService(email);
    res.status(200).json(result);
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error.message);

    let status = 500;
    if (error.message.includes('AUTH_ERROR')) status = 404;

    res.status(status).json({ message: error.message });
  }
};

// ===== TOKEN DOĞRULAMA (RESET PASSWORD HTML SAYFASI) =====
export const resetAdminPassword = async (req, res) => {
  const { token } = req.query; // URL'den token al

  if (!token) {
    return res.status(400).json({ message: 'Şifre sıfırlama token\'ı bulunamadı.' });
  }

  try {
    const result = await resetAdminPasswordService(token);

    // Frontend HTML sayfasına token ve e-posta gönderilebilir
    res.status(200).json({
      message: 'Şifre sıfırlama sayfasına yönlendiriliyorsunuz...',
      token: token,
      email: result.email
    });
  } catch (error) {
    console.error('Token doğrulama hatası:', error.message);

    let status = 500;
    if (error.message.includes('TOKEN_INVALID') || error.message.includes('TOKEN_EXPIRED')) {
      status = 400;
    }

    res.status(status).json({ message: error.message });
  }
};

// ===== YENİ ŞİFRE BELİRLEME =====
export const setNewPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Tüm alanları doldurun.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Şifreler eşleşmiyor.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır.' });
    }

    const result = await setNewPasswordService(token, newPassword);

    res.status(200).json({
      message: 'Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.',
      success: true
    });
  } catch (error) {
    console.error('Şifre güncelleme hatası:', error.message);

    let status = 500;
    if (error.message.includes('TOKEN_INVALID') || error.message.includes('TOKEN_EXPIRED')) {
      status = 400;
    }

    res.status(status).json({ message: error.message });
  }
};
// ===== SİTE OLUŞTURMA =====
export const createSite = async (req, res) => {
  const adminId = req.admin ? req.admin.id : null;
  const { site_id, site_name, site_address } = req.body;

  if (!site_id || !site_name || !site_address) {
    return res.status(400).json({ message: 'Tüm site alanlarını doldurun (Site ID, Adı, Adresi).' });
  }

  if (!adminId) {
    return res.status(401).json({ message: 'Oturum açmış Admin bulunamadı veya token geçersiz.' });
  }

  try {
    const newSite = await createSiteService(adminId, {
      site_id,
      site_name,
      site_address
    });

    res.status(201).json({
      message: 'Site başarıyla oluşturuldu.',
      site: newSite
    });
  } catch (error) {
    console.error('Site oluşturma hatası:', error.message);
    
    let status = 500;
    if (error.message.includes('LIMIT_EXCEEDED')) status = 403;
    else if (error.message.includes('SITE_ERROR')) status = 409;
    else if (error.message.includes('AUTH_ERROR')) status = 404;

    res.status(status).json({ message: error.message });
  }
};

// ===== ADMIN'E AİT SİTELERİ LİSTELE =====
export const getSitesByAdmin = async (req, res) => {
  const adminId = req.admin ? req.admin.id : null;

  if (!adminId) {
    return res.status(401).json({ message: 'Oturum açmış Admin bulunamadı veya token geçersiz.' });
  }

  try {
    const sites = await prisma.site.findMany({
      where: { adminId }
    });

    res.status(200).json({
      message: "Admin'e ait siteler başarıyla listelendi.",
      sites
    });
  } catch (error) {
    console.error('Site listeleme hatası:', error.message);
    res.status(500).json({ message: 'Siteler alınamadı.', error: error.message });
  }
};
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
export async function registerUserService(userData) {
  const { full_name, phone_number, password, site_id, block_no, apartment_no } = userData;

  // Telefon formatı kontrolü
  if (!/^\+?\d{10,15}$/.test(phone_number)) {
    throw new Error('VALIDATION_ERROR: Geçersiz telefon numarası formatı.');
  }

  // Site kontrolü
  const site = await prisma.site.findUnique({ where: { site_id } });
  if (!site) throw new Error('USER_ERROR: Belirtilen Site ID bulunamadı.');

  // Telefon çakışması kontrolü
  const existingUser = await prisma.user.findUnique({ where: { phone_number } });
  if (existingUser) throw new Error('AUTH_ERROR: Bu telefon numarası zaten kayıtlı.');

  // Şifreyi hashle
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 6 haneli güvenli doğrulama kodu
  const verificationCode = crypto.randomInt(100000, 999999).toString();

  // Kod 10 dakika geçerli
  const codeExpiry = new Date(Date.now() + 10 * 60 * 1000);

  // Kullanıcı oluştur (henüz doğrulanmamış)
  const newUser = await prisma.user.create({
    data: {
      full_name,
      phone_number,
      password: hashedPassword,
      siteId: site.id,
      block_no,
      apartment_no,
      is_verified: false,
      phone_verification_code: verificationCode,
      code_expiry: codeExpiry
    },
    select: {
      id: true,
      full_name: true,
      phone_number: true,
      siteId: true,
      block_no: true,
      apartment_no: true
    }
  });

  // SMS gönder
  try {
    await twilioClient.messages.create({
    body: `Site Yönetimi: Doğrulama kodunuz ${verificationCode}. Kod 10 dakika geçerlidir.`,
    from: process.env.TWILIO_PHONE_NUMBER, // Bu mutlaka Twilio numarası olmalı
    to: phone_number
  });
  } catch (err) {
    console.error('SMS gönderilemedi:', err);
    throw new Error('SMS_ERROR: Doğrulama kodu gönderilemedi. Lütfen daha sonra tekrar deneyin.');
  }

  return {
    message: 'Kayıt işlemi tamamlandı. Telefonunuza gönderilen doğrulama kodunu girerek hesabınızı aktifleştirin.',
    userId: newUser.id
  };
}

export async function verifyPhoneService(phone_number, code) {
  const user = await prisma.user.findUnique({ where: { phone_number } });
  if (!user) throw new Error('USER_ERROR: Kullanıcı bulunamadı.');

  if (user.is_verified) return { message: 'Bu hesap zaten doğrulanmış.' };
  if (user.phone_verification_code !== code) throw new Error('AUTH_ERROR: Geçersiz doğrulama kodu.');

  // 🔧 Tarih kıyaslamasını güvenli hale getir
  const now = new Date();
  const expiry = new Date(user.code_expiry);
  if (now > expiry) {
    throw new Error('AUTH_ERROR: Doğrulama kodunun süresi dolmuş.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      is_verified: true,
      phone_verification_code: null,
      code_expiry: null
    }
  });

  return { message: 'Telefon numaranız başarıyla doğrulandı. Hesabınız aktif!' };
}


// ===== KULLANICI GİRİŞİ =====
export async function loginUserService(loginData) {
  const { phone_number, password } = loginData;

  const user = await prisma.user.findUnique({
    where: { phone_number },
    select: {
      id: true,
      full_name: true,
      phone_number: true,
      password: true,
      siteId: true,
      block_no: true,
      apartment_no: true,
      is_verified: true
    }
  });

  if (!user) throw new Error('AUTH_ERROR: Telefon numarası veya şifre hatalı.');
  if (!user.is_verified) throw new Error('AUTH_ERROR: Hesabınız doğrulanmamış. Lütfen SMS kodunu girin.');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('AUTH_ERROR: Telefon numarası veya şifre hatalı.');

  const { password: _, ...userData } = user;
  return userData;
}

// ===== ADMIN KAYDI (DOĞRULAMA GEREKİYOR) =====
export async function registerAdminService(adminData) {
  const { full_name, email, password, account_type, company_name } = adminData;

  // E-posta çakışması kontrolü
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (existingAdmin) throw new Error('AUTH_ERROR: Bu e-posta adresi zaten kayıtlı.');

  // Şifreyi hash'le
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Doğrulama token'ı üret
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Token süresi (şu anki zaman + 24 saat)
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Doğrulama linki (Backend URL'i kullan)
  const verificationLink = `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`;


  // Mail gönder
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Admin Hesap Doğrulama',
    html: `<p>Merhaba ${full_name},</p>
           <p>Lütfen hesabınızı aktifleştirmek için linke tıklayın (link 24 saat geçerlidir):</p>
           <a href="${verificationLink}">Hesabı Doğrula</a>`
  });

  // Admin oluştur (henüz doğrulanmamış)
  const newAdmin = await prisma.admin.create({
    data: {
      full_name,
      email,
      password: hashedPassword,
      account_type,
      company_name: account_type === 'COMPANY' ? company_name : null,
      isVerified: false,
      verificationToken,
      tokenExpiry
    }
  });

  return {
    message: 'Kayıt tamamlanmadı. Hesabınızı aktifleştirmek için e-postanızı kontrol edin.'
  };
}

// ===== E-POSTA DOĞRULAMA =====
export async function verifyEmailService(token) {
  const admin = await prisma.admin.findFirst({
    where: {
      verificationToken: token,
      tokenExpiry: {
        gt: new Date() // Token süresi dolmamış olmalı
      }
    }
  });

  if (!admin) {
    throw new Error('TOKEN_INVALID: Geçersiz veya süresi dolmuş doğrulama token\'ı.');
  }

  // Admin'i aktif et ve token'ı temizle
  const updatedAdmin = await prisma.admin.update({
    where: { id: admin.id },
    data: {
      isVerified: true,
      verificationToken: null,
      tokenExpiry: null
    }
  });

  return updatedAdmin;
}
// ===== ADMIN GİRİŞİ =====
export async function loginAdminService(loginData) {
  const { email, password } = loginData;

  // E-posta ile admin bul
  const admin = await prisma.admin.findUnique({
    where: { email },
    select: {
      id: true,
      full_name: true,
      email: true,
      password: true,
      account_type: true,
      company_name: true,
      isVerified: true
    }
  });

  if (!admin) {
    throw new Error('AUTH_ERROR: E-posta veya şifre hatalı.');
  }

  // Doğrulama kontrolü
  if (!admin.isVerified) {
    throw new Error('AUTH_ERROR: Hesabınız doğrulanmamış. Lütfen e-postanızı kontrol edin.');
  }

  // Şifre kontrolü
  const isPasswordValid = await bcrypt.compare(password, admin.password);

  if (!isPasswordValid) {
    throw new Error('AUTH_ERROR: E-posta veya şifre hatalı.');
  }

  // Şifre alanını çıkart
  const { password: _, ...adminData } = admin;
  return adminData;
}

// ===== SİTE OLUŞTURMA =====
export async function createSiteService(adminId, siteData) {
  const { site_id, site_name, site_address } = siteData;

  // site_id benzersizlik kontrolü
  const existingSite = await prisma.site.findUnique({ where: { site_id } });
  if (existingSite) {
    throw new Error('SITE_ERROR: Bu site kimliği (ID) zaten kullanılıyor.');
  }

  // Admin ve mevcut sitelerini al
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: { sites_created: true }
  });

  if (!admin) {
    throw new Error('AUTH_ERROR: Admin bulunamadı.');
  }

  const currentSiteCount = admin.sites_created.length;
  let siteLimit = 0;

  // Site limiti kontrolü
  if (admin.account_type === 'INDIVIDUAL') {
    siteLimit = 1;
  } else if (admin.account_type === 'COMPANY') {
    siteLimit = 5;
  }

  if (currentSiteCount >= siteLimit) {
    throw new Error(`LIMIT_EXCEEDED: Hesap türünüz (${admin.account_type}) ile en fazla ${siteLimit} site oluşturabilirsiniz. Limitiniz doldu.`);
  }

  // Yeni site oluştur
  const newSite = await prisma.site.create({
    data: {
      site_id,
      site_name,
      site_address,
      adminId: admin.id
    }
  });

  return newSite;
}
import prisma from '../../prismaClient.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordSetupCode } from '../shared/sms.service.js';
import { validatePhoneNumber, validatePassword, validatePasswordMatch } from '../shared/validation.service.js';

const SALT_ROUNDS = 10;

/**
 * Mobil kullanıcı şifre belirleme süreci başlatma
 * 1. Telefon + Site ID ile kullanıcıyı bul
 * 2. Doğrulama kodu gönder
 * 3. Kullanıcı kodu girip şifresini belirleyecek
 */
export async function initiatePasswordSetupService(phone_number, site_id) {
  // Telefon formatı kontrolü
  validatePhoneNumber(phone_number);

  // Site kontrolü
  const site = await prisma.site.findUnique({ 
    where: { site_id },
    select: { id: true, site_status: true }
  });
  
  if (!site) throw new Error('USER_ERROR: Belirtilen Site ID bulunamadı.');
  if (site.site_status !== 'ACTIVE') throw new Error('USER_ERROR: Bu site aktif değil.');

  // Kullanıcı kontrolü (telefon + site ile)
  const user = await prisma.user.findFirst({
    where: {
      phone_number,
      siteId: site.id,
      deleted_at: null
    },
    select: {
      id: true,
      full_name: true,
      phone_number: true,
      is_password_set: true,
      account_status: true
    }
  });

  if (!user) {
    throw new Error('USER_ERROR: Bu telefon numarası ve Site ID ile kayıtlı kullanıcı bulunamadı.');
  }

  if (user.account_status !== 'ACTIVE') {
    throw new Error('USER_ERROR: Hesabınız aktif değil.');
  }

  // 6 haneli güvenli doğrulama kodu
  const verificationCode = crypto.randomInt(100000, 999999).toString();
  const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

  // Doğrulama kodunu kaydet
  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone_verification_code: verificationCode,
      code_expiry: codeExpiry
    }
  });

  // SMS gönder
  await sendPasswordSetupCode(phone_number, verificationCode);

  return {
    message: user.is_password_set 
      ? 'Telefonunuza doğrulama kodu gönderildi. Kodu girerek giriş yapabilirsiniz.'
      : 'Telefonunuza doğrulama kodu gönderildi. Kodu girip şifrenizi belirleyin.',
    userId: user.id,
    is_password_set: user.is_password_set
  };
}

/**
 * Doğrulama kodu ile şifre belirleme
 */
export async function setPasswordWithCodeService(phone_number, code, password, password_confirm) {
  // Validasyonlar
  validatePasswordMatch(password, password_confirm);
  validatePassword(password, 6);

  const user = await prisma.user.findUnique({ 
    where: { phone_number },
    select: {
      id: true,
      phone_verification_code: true,
      code_expiry: true,
      account_status: true,
      deleted_at: true,
      is_password_set: true
    }
  });
  
  if (!user) throw new Error('USER_ERROR: Kullanıcı bulunamadı.');
  if (user.deleted_at) throw new Error('USER_ERROR: Bu hesap silinmiş.');
  if (user.account_status !== 'ACTIVE') throw new Error('USER_ERROR: Hesabınız aktif değil.');
  if (user.phone_verification_code !== code) throw new Error('AUTH_ERROR: Geçersiz doğrulama kodu.');

  const now = new Date();
  const expiry = new Date(user.code_expiry);
  if (now > expiry) {
    throw new Error('AUTH_ERROR: Doğrulama kodunun süresi dolmuş.');
  }

  // Şifreyi hashle
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Şifreyi kaydet
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      is_password_set: true,
      phone_verification_code: null,
      code_expiry: null,
      last_login: new Date()
    }
  });

  return { 
    message: user.is_password_set 
      ? 'Şifreniz güncellendi. Giriş yapabilirsiniz.' 
      : 'Şifreniz başarıyla belirlendi. Artık giriş yapabilirsiniz!' 
  };
}

/**
 * Mobil kullanıcı girişi
 */
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
      is_password_set: true,
      account_status: true,
      deleted_at: true,
      block_id: true,
      site: {
        select: {
          site_id: true,
          site_name: true,
          site_address: true
        }
      },
      block: {
        select: {
          id: true,
          block_name: true
        }
      }
    }
  });

  if (!user) throw new Error('AUTH_ERROR: Telefon numarası veya şifre hatalı.');
  if (user.deleted_at) throw new Error('AUTH_ERROR: Bu hesap silinmiş.');
  if (user.account_status === 'SUSPENDED') throw new Error('AUTH_ERROR: Hesabınız askıya alınmış.');
  if (!user.is_password_set || !user.password) {
    throw new Error('AUTH_ERROR: Henüz şifre belirlenmemiş. Lütfen şifre belirleme işlemini tamamlayın.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('AUTH_ERROR: Telefon numarası veya şifre hatalı.');

  // Last login güncelle
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login: new Date() }
  });

  const { password: _, ...userData } = user;
  return userData;
}
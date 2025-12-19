import prisma from '../../../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import { validatePhoneNumber, validatePassword, validatePasswordMatch } from '../../../shared/validation.service.js';

const SALT_ROUNDS = 10;

/**
 * Mobil kullanıcı şifre belirleme süreci başlatma
 * 1. Telefon + Site ID ile kullanıcıyı bul
 * 2. Kullanıcıya frontend (Firebase) ile OTP gönderilecek
 * 3. Kullanıcı kodu girip şifresini belirleyecek
 */
export async function initiatePasswordSetupService(phone_number, site_id) {
  validatePhoneNumber(phone_number);

  const site = await prisma.site.findUnique({ 
    where: { site_id },
    select: { id: true, site_status: true }
  });
  
  if (!site) throw new Error('USER_ERROR: Belirtilen Site ID bulunamadı.');
  if (site.site_status !== 'ACTIVE') throw new Error('USER_ERROR: Bu site aktif değil.');

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

  // Artık kod backend tarafından üretilmiyor, sadece kullanıcı doğrulanıyor.
  return {
    message: user.is_password_set 
      ? 'Kullanıcı doğrulandı. OTP kodunu girerek giriş yapabilirsiniz.'
      : 'Kullanıcı doğrulandı. OTP kodunu girip şifrenizi belirleyin.',
    userId: user.id,
    is_password_set: user.is_password_set
  };
}

/**
 * Doğrulama kodu ile şifre belirleme (OTP kodu frontendden alınacak)
 */
export async function setPasswordWithCodeService(phone_number, code, password, password_confirm) {
  validatePasswordMatch(password, password_confirm);
  validatePassword(password, 6);

  const user = await prisma.user.findUnique({ 
    where: { phone_number },
    select: {
      id: true,
      account_status: true,
      deleted_at: true,
      is_password_set: true
    }
  });
  
  if (!user) throw new Error('USER_ERROR: Kullanıcı bulunamadı.');
  if (user.deleted_at) throw new Error('USER_ERROR: Bu hesap silinmiş.');
  if (user.account_status !== 'ACTIVE') throw new Error('USER_ERROR: Hesabınız aktif değil.');

  // Firebase ile OTP doğrulaması frontendde yapılacak!
  // Burada kod kontrolü yapılmayacak, frontendden gelen doğrulama sonrası şifre kaydedilecek.

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      is_password_set: true,
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
      monthlyDues: {
        where: { deleted_at: null},
        orderBy: [
          { year : 'desc'},
          { month : 'desc' }
          ],
          include: {
            sites: {
              select: { site_name : true }
            }
         }
      },
      full_name: true,
      phone_number: true,
      password: true,
      siteId: true,
      block_id: true,
      apartment_no: true,
      is_password_set: true,
      account_status: true,
      deleted_at: true,
      site: {
        select: {
          id: true,
          site_name: true,
          site_address: true
        }
      },
      blocks: {
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
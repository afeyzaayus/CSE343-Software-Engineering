import prisma from '../../../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordResetCode } from '../../../shared/sms.service.js';
import { sendPasswordResetEmail } from '../../../shared/email.service.js';

const SALT_ROUNDS = 10;

// ============================================
// MOBİL KULLANICI ŞİFRE İŞLEMLERİ
// ============================================

/**
 * Kullanıcı - Şifre sıfırlama için kod gönder
 */
export async function forgotUserPasswordService(phone_number) {
  const user = await prisma.user.findUnique({
    where: { phone_number },
    select: { id: true, deleted_at: true, account_status: true, is_password_set: true }
  });

  if (!user || user.deleted_at || user.account_status !== 'ACTIVE') {
    return { message: 'Telefon numaranıza doğrulama kodu gönderildi.' };
  }

  if (!user.is_password_set) {
    throw new Error('USER_ERROR: Henüz şifre belirlenmemiş. Lütfen şifre belirleme işlemini kullanın.');
  }

  const resetCode = crypto.randomInt(100000, 999999).toString();
  const resetCodeExpiry = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { reset_code: resetCode, reset_code_expiry: resetCodeExpiry }
  });

  await sendPasswordResetCode(phone_number, resetCode);

  return { message: 'Doğrulama kodu telefonunuza gönderildi.' };
}

/**
 * Kullanıcı - Kod ile şifre sıfırlama
 */
export async function resetUserPasswordService(phone_number, code, newPassword) {
  const user = await prisma.user.findUnique({
    where: { phone_number },
    select: { id: true, reset_code: true, reset_code_expiry: true, deleted_at: true }
  });

  if (!user || user.deleted_at) throw new Error('USER_ERROR: Kullanıcı bulunamadı.');
  if (user.reset_code !== code) throw new Error('AUTH_ERROR: Geçersiz doğrulama kodu.');
  if (new Date() > new Date(user.reset_code_expiry)) throw new Error('AUTH_ERROR: Kodun süresi dolmuş.');

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, reset_code: null, reset_code_expiry: null }
  });

  return { message: 'Şifreniz başarıyla güncellendi.' };
}

/**
 * Kullanıcı - Ayarlar kısmından mevcut şifre ile değişim
 */
export async function changeUserPasswordService(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, deleted_at: true }
  });

  if (!user || user.deleted_at) throw new Error('USER_ERROR: Kullanıcı bulunamadı.');
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error('AUTH_ERROR: Mevcut şifre hatalı.');

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  return { message: 'Şifreniz başarıyla güncellendi.' };
}

// ============================================
// ADMIN ŞİFRE İŞLEMLERİ
// ============================================

/**
 * Admin - Şifremi unuttum e-posta gönderimi
 */
export async function forgotAdminPasswordService(email) {
  const admin = await prisma.admin.findUnique({
    where: { email: email?.toLowerCase() },
    select: { id: true, full_name: true, deleted_at: true, account_status: true, email: true }
  });

  if (!admin || admin.deleted_at || admin.account_status !== 'ACTIVE') {
    return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi (Kayıtlıysa).' };
  }

  if (!admin.email) {
    console.warn(`Admin id=${admin.id} e-posta adresi yok.`);
    return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi (Kayıtlıysa).' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.admin.update({
    where: { id: admin.id },
    data: { resetToken, resetTokenExpiry }
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
  await sendPasswordResetEmail(admin.email, admin.full_name, resetLink);

  return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi (Kayıtlıysa).' };
}

/**
 * Admin - Token doğrulama
 */
export async function resetAdminPasswordService(token) {
  const admin = await prisma.admin.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } }
  });

  if (!admin) throw new Error('TOKEN_INVALID: Geçersiz veya süresi dolmuş token.');

  return { email: admin.email, message: 'Token geçerli.' };
}

/**
 * Admin - Token ile yeni şifre belirleme
 */
export async function setNewPasswordService(token, newPassword) {
  const admin = await prisma.admin.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } }
  });

  if (!admin) throw new Error('TOKEN_INVALID: Geçersiz veya süresi dolmuş token.');

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.admin.update({
    where: { id: admin.id },
    data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
  });

  return { message: 'Şifre başarıyla güncellendi.' };
}

/**
 * Admin - Ayarlar kısmından mevcut şifre ile değişim
 */
export async function changeAdminPasswordService(adminId, currentPassword, newPassword) {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { password: true, deleted_at: true }
  });

  if (!admin || admin.deleted_at) throw new Error('USER_ERROR: Admin bulunamadı.');
  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) throw new Error('AUTH_ERROR: Mevcut şifre hatalı.');

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.admin.update({
    where: { id: adminId },
    data: { password: hashedPassword }
  });

  return { message: 'Şifreniz başarıyla güncellendi.' };
}

import bcrypt from 'bcrypt';
import prisma from '../../../prisma/prismaClient.js';
import {
  forgotUserPasswordService,
  resetUserPasswordService,
  changeUserPasswordService,
  forgotAdminPasswordService,
  resetAdminPasswordService,
  setNewPasswordService,
  changeAdminPasswordService
} from '../../../../src/index.js';

// ==========================================================
// MOBİL USER – FORGOT PASSWORD (SMS)
// ==========================================================
export async function forgotUserPassword(req, res) {
  try {
    const { phone_number } = req.body;
    if (!phone_number) {
      return res.status(400).json({ success: false, error: 'Telefon numarası zorunludur.' });
    }
    const result = await forgotUserPasswordService(phone_number);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error('forgotUserPassword HATASI:', error);
    if (error.message?.includes('USER_ERROR')) {
      return res.status(404).json({ success: false, error: error.message.replace('USER_ERROR: ', '') });
    }
    return res.status(500).json({ success: false, error: 'Şifre sıfırlama kodu gönderilirken hata oluştu.' });
  }
}

// ==========================================================
// MOBİL USER – RESET PASSWORD (SMS)
// ==========================================================
export async function resetUserPassword(req, res) {
  try {
    const { phone_number, code, new_password } = req.body;
    if (!phone_number || !code || !new_password) {
      return res.status(400).json({ success: false, error: 'Tüm alanlar zorunludur.' });
    }
    const result = await resetUserPasswordService(phone_number, code, new_password);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error('resetUserPassword HATASI:', error);
    if (error.message?.includes('USER_ERROR')) {
      return res.status(404).json({ success: false, error: error.message.replace('USER_ERROR: ', '') });
    }
    if (error.message?.includes('AUTH_ERROR')) {
      return res.status(401).json({ success: false, error: error.message.replace('AUTH_ERROR: ', '') });
    }
    return res.status(500).json({ success: false, error: 'Şifre sıfırlanırken bir hata oluştu.' });
  }
}

// ==========================================================
// USER – CHANGE PASSWORD (LOGIN GEREKLİ)
// ==========================================================
export async function changeUserPassword(req, res) {
  try {
    const userId = req.user?.id;
    const { current_password, new_password, password_confirm } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Yetkisiz işlem.' });
    }
    if (!current_password || !new_password || !password_confirm) {
      return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur.' });
    }
    if (new_password !== password_confirm) {
      return res.status(400).json({ success: false, message: 'Şifreler eşleşmiyor.' });
    }

    const result = await changeUserPasswordService(userId, current_password, new_password);
    return res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('changeUserPassword HATASI:', error);
    if (error.message?.includes('USER_ERROR')) {
      return res.status(404).json({ success: false, message: error.message.replace('USER_ERROR: ', '') });
    }
    if (error.message?.includes('AUTH_ERROR')) {
      return res.status(401).json({ success: false, message: error.message.replace('AUTH_ERROR: ', '') });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
}

// ==========================================================
// ADMIN – FORGOT PASSWORD (EMAIL)
// ==========================================================
export async function forgotAdminPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'E-posta adresi zorunludur.' });
    }
    await forgotAdminPasswordService(email);
    return res.status(200).json({ success: true, message: 'Şifre sıfırlama linki e-posta adresinize gönderildi (Kayıtlıysa).' });
  } catch (error) {
    console.error('forgotAdminPassword HATASI:', error);
    // Güvenlik için hata olsa da aynı mesajı döndür
    return res.status(200).json({ success: true, message: 'Şifre sıfırlama linki e-posta adresinize gönderildi (Kayıtlıysa).' });
  }
}

// ==========================================================
// ADMIN – TOKEN DOĞRULAMA
// ==========================================================
export async function validateResetToken(req, res) {
  try {
    const { token } = req.params;
    const result = await resetAdminPasswordService(token);
    return res.status(200).json({ success: true, message: 'Token geçerli.', email: result.email });
  } catch (error) {
    console.error('validateResetToken HATASI:', error);
    return res.status(400).json({ success: false, message: 'Geçersiz veya süresi dolmuş token.' });
  }
}

// ==========================================================
// ADMIN – SET NEW PASSWORD (TOKEN)
// ==========================================================
export async function setNewPassword(req, res) {
  try {
    const { token, new_password, password_confirm } = req.body;
    if (!token || !new_password || !password_confirm) {
      return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur.' });
    }
    if (new_password !== password_confirm) {
      return res.status(400).json({ success: false, message: 'Şifreler eşleşmiyor.' });
    }
    const result = await setNewPasswordService(token, new_password);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error('setNewPassword HATASI:', error);
    return res.status(400).json({ success: false, message: 'Geçersiz veya süresi dolmuş token.' });
  }
}

// ==========================================================
// USER & ADMIN – CHANGE PASSWORD (LOGIN)
// ==========================================================
export async function changePasswordWithLogin(req, res) {
  try {
    const account = req.user || req.admin;
    if (!account) {
      return res.status(401).json({ success: false, message: 'Yetkisiz işlem.' });
    }
    const { current_password, new_password, password_confirm } = req.body;
    if (!current_password || !new_password || !password_confirm) {
      return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur.' });
    }
    if (new_password !== password_confirm) {
      return res.status(400).json({ success: false, message: 'Şifreler eşleşmiyor.' });
    }
    const match = await bcrypt.compare(current_password, account.password);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Mevcut şifre yanlış.' });
    }
    const hashed = await bcrypt.hash(new_password, 10);
    if (req.user) {
      await prisma.user.update({ where: { id: account.id }, data: { password: hashed } });
    } else {
      await prisma.admin.update({ where: { id: account.id }, data: { password: hashed } });
    }
    return res.json({ success: true, message: 'Şifreniz başarıyla güncellendi.' });
  } catch (err) {
    console.error('changePasswordWithLogin HATASI:', err);
    return res.status(500).json({ success: false, message: 'Şifre değiştirilirken hata oluştu.' });
  }
}
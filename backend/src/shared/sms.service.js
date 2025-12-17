import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Twilio opsiyonel - sadece credentials varsa başlatılır
export const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Şifre belirleme doğrulama kodu gönder
 */
export async function sendPasswordSetupCode(phone_number, verificationCode) {
  try {
    await twilioClient.messages.create({
      body: `Site Yönetimi: Şifre belirleme kodunuz ${verificationCode}. Kod 10 dakika geçerlidir.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone_number
    });
  } catch (err) {
    console.error('SMS gönderilemedi:', err);
    throw new Error('SMS_ERROR: Doğrulama kodu gönderilemedi.');
  }
}

/**
 * Şifre sıfırlama kodu gönder
 */
export async function sendPasswordResetCode(phone_number, resetCode) {
  try {
    await twilioClient.messages.create({
      body: `Site Yönetimi: Şifre sıfırlama kodunuz ${resetCode}. Kod 5 dakika geçerlidir.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone_number
    });
  } catch (err) {
    console.error('SMS gönderilemedi:', err);
    throw new Error('SMS_ERROR: Kod gönderilemedi.');
  }
}
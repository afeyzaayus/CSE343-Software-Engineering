import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email transporter
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Bireysel hesap doğrulama maili
 */
export async function sendIndividualVerificationEmail(email, full_name, verificationLink) {
  return await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Bireysel Hesap Doğrulama',
    html: `<p>Merhaba ${full_name},</p>
           <p>Bireysel hesabınızı oluşturdunuz.</p>
           <p>Hesabınızı aktifleştirmek için aşağıdaki linke tıklayın (24 saat geçerli):</p>
           <a href="${verificationLink}">Hesabı Doğrula</a>
           <p>İyi günler!</p>`
  });
}

/**
 * Şirket yöneticisi hesap doğrulama maili
 */
export async function sendCompanyManagerVerificationEmail(email, full_name, company_name, company_code, verificationLink) {
  return await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Şirket Yöneticisi Hesap Doğrulama',
    html: `
      <p>Merhaba ${full_name},</p>
      <p>Şirketiniz: <strong>${company_name}</strong></p>
      <p>Şirket Kodunuz: <strong style="font-size: 24px; color: #007bff;">${company_code}</strong></p>
      <p>Bu kodu çalışanlarınıza paylaşarak şirketinize katılmalarını sağlayabilirsiniz.</p>
      <p>Hesabınızı aktifleştirmek için linke tıklayın (24 saat geçerli):</p>
      <a href="${verificationLink}">Hesabı Doğrula</a>
    `
  });
}

/**
 * Çalışan davet maili
 */
export async function sendEmployeeInvitationEmail(email, company_name, invite_code, invite_link) {
  return await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `${company_name} - Çalışan Daveti`,
    html: `
      <p>Merhaba,</p>
      <p><strong>${company_name}</strong> şirketine çalışan olarak davet edildiniz!</p>
      <p>Davet Kodu: <strong>${invite_code}</strong></p>
      <p>Katılmak için aşağıdaki linke tıklayın (7 gün geçerli):</p>
      <a href="${invite_link}">Şirkete Katıl</a>
    `
  });
}

export async function sendPasswordResetEmail(email, full_name, resetLink) {
  if (!email) {
    console.warn('sendPasswordResetEmail: Alıcı e-posta adresi tanımlı değil, e-posta gönderilmedi.');
    return;
  }

  return await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Şifre Sıfırlama Talebi',
    html: `
      <p>Merhaba ${full_name},</p>
      <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın. Bu bağlantı 15 dakika geçerlidir:</p>
      <a href="${resetLink}" style="
          display: inline-block;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 10px;
      ">Şifreyi Sıfırla</a>
      <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
    `
  });
}
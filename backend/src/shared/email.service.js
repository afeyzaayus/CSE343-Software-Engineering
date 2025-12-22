import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 2525,
  secure: false, // STARTTLS kullanıyorsan false
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  family: 4
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
export async function sendEmployeeInvitationEmail(toEmail, companyName, inviteCode, inviteLink) {
  const mailOptions = {
    from: `"${companyName}" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `🎉 ${companyName} Şirketine Davetlisiniz!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${companyName} Daveti</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <!-- Main Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1a5276 0%, #2e86c1 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
                      🎉 Davetlisiniz!
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Merhaba,
                    </p>
                    
                    <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                      <strong style="color: #1a5276;">${companyName}</strong> şirketine çalışan olarak katılmanız için davet edildiniz. 
                      Ekibimize katılmak için aşağıdaki bilgileri kullanarak kayıt olabilirsiniz.
                    </p>
                    
                    <!-- Invite Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #ebf5fb 0%, #d6eaf8 100%); padding: 25px; border-radius: 10px; border-left: 4px solid #1a5276;">
                          <p style="margin: 0 0 10px 0; color: #1a5276; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                            Davet Kodunuz
                          </p>
                          <p style="margin: 0; font-size: 32px; font-weight: bold; color: #1a5276; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                            ${inviteCode}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin: 30px 0;">
                      Kayıt işlemini tamamlamak için aşağıdaki butona tıklayın:
                    </p>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${inviteLink}" 
                             style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #1a5276 0%, #2e86c1 100%); 
                                    color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; 
                                    box-shadow: 0 4px 12px rgba(26, 82, 118, 0.3); transition: all 0.3s ease;">
                            Kayıt Olmak İçin Tıklayın →
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Alternative Link -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td style="background: #ebf5fb; padding: 20px; border-radius: 8px; border: 1px dashed #2e86c1;">
                          <p style="margin: 0 0 10px 0; color: #1a5276; font-size: 13px; font-weight: 600;">
                            Buton çalışmıyor mu? Bu linki kopyalayın:
                          </p>
                          <p style="margin: 0; color: #2e86c1; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">
                            ${inviteLink}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Info Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                          <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                            ⏰ <strong>Önemli:</strong> Bu davet linki <strong>7 gün</strong> süreyle geçerlidir.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #f8f9fa; padding: 30px; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 13px; line-height: 1.5; text-align: center;">
                      Bu daveti beklemiyorsanız, bu e-postayı güvenle görmezden gelebilirsiniz.
                    </p>
                    <p style="margin: 0; color: #adb5bd; font-size: 12px; text-align: center;">
                      © ${new Date().getFullYear()} ${companyName}. Tüm hakları saklıdır.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Davet e-postası başarıyla gönderildi:', toEmail);
    return { success: true, message: 'E-posta gönderildi' };
  } catch (error) {
    console.error('❌ E-posta gönderme hatası:', error);
    throw new Error('E-posta gönderilemedi: ' + error.message);
  }
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

/**
 * Genel amaçlı e-posta gönderme fonksiyonu
 * 
 * Kullanım:
 * await sendEmail({
 *   to: email,
 *   subject: 'Başlık',
 *   html: '<p>İçerik</p>'
 * });
 */
export async function sendEmail({ to, subject, html }) {
  if (!to) {
    throw new Error("sendEmail: 'to' alanı zorunludur.");
  }
  if (!subject) {
    throw new Error("sendEmail: 'subject' alanı zorunludur.");
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📨 E-posta başarıyla gönderildi:", to);
    return info;
  } catch (err) {
    console.error("❌ sendEmail hata:", err);
    throw new Error("E-posta gönderilemedi: " + err.message);
  }
}

import prisma from '../../../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendIndividualVerificationEmail, sendCompanyManagerVerificationEmail } from '../../../shared/email.service.js';
import { validateCompanyCode } from '../../../shared/validation.service.js';

const SALT_ROUNDS = 10;

/**
 * Bireysel Admin Kaydı
 */
export async function registerIndividualService({ full_name, email, password }) {
  try {
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) throw new Error('Bu e-posta adresi zaten kullanımda.');

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const verificationLink = `${process.env.BASE_URL}/api/auth/admin/verify-email?token=${verificationToken}`;

    const newAdmin = await prisma.admin.create({
      data: {
        full_name,
        email,
        password: hashedPassword,
        account_type: 'INDIVIDUAL',
        account_status: 'ACTIVE',
        is_verified: false,
        verificationToken,
        tokenExpiry: verificationExpires,
        created_at: new Date()
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        account_type: true,
        account_status: true,
        is_verified: true,
        created_at: true
      }
    });

    let emailSent = false;
    try {
      await sendIndividualVerificationEmail(email, full_name, verificationLink);
      emailSent = true;
    } catch (emailError) {
      console.error('E-posta gönderme hatası:', emailError);
    }

    return { admin: newAdmin, emailSent };

  } catch (error) {
    console.error('registerIndividual service hatası:', error);
    throw error;
  }
}

/**
 * Şirket Yöneticisi Kaydı
 */
export async function registerCompanyManagerService(adminData) {
  const { full_name, email, password, company_name, company_code } = adminData;

  validateCompanyCode(company_code, 4);

  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (existingAdmin) throw new Error('AUTH_ERROR: Bu e-posta adresi zaten kayıtlı.');

  // Eğer şirket zaten varsa onu bağlayacağız
  let company = await prisma.companies.findUnique({ where: { company_code } });

  // Şirket yoksa oluştur
  if (!company) {
    company = await prisma.companies.create({
      data: {
        company_name,
        company_code,
        account_status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const verificationLink = `${process.env.BASE_URL}/api/auth/admin/verify-email?token=${verificationToken}`;

  // Admini oluştur ve şirketi bağla
  const newAdmin = await prisma.admin.create({
    data: {
      full_name,
      email,
      password: hashedPassword,
      account_type: 'COMPANY_MANAGER',
      account_status: 'ACTIVE',
      is_verified: false,
      verificationToken,
      tokenExpiry,
      created_at: new Date(),
      updated_at: new Date(),
      company_name,
      company_code,
      companyId: company.id
    },
    include: { company: true }
  });

  // Aktivasyon maili gönder
  try {
    await sendCompanyManagerVerificationEmail(
      email,
      full_name,
      newAdmin.company_name,
      newAdmin.company_code,
      verificationLink
    );
  } catch (err) {
    console.error('E-posta gönderilemedi:', err);
  }

  return {
    message: 'Kayıt tamamlandı. Hesabınızı aktifleştirmek için e-postanızı kontrol edin.',
    admin: {
      id: newAdmin.id,
      name: newAdmin.full_name,
      role: newAdmin.account_type,
      company_name: newAdmin.company_name,
      company_code: newAdmin.company_code
    }
  };
}

/**
 * E-posta doğrulama
 */
export async function verifyEmailService(token) {
  const admin = await prisma.admin.findFirst({
    where: { verificationToken: token, tokenExpiry: { gt: new Date() } }
  });

  if (!admin) throw new Error('TOKEN_INVALID: Geçersiz veya süresi dolmuş token.');

  return await prisma.admin.update({
    where: { id: admin.id },
    data: {
      is_verified: true,
      verificationToken: null,
      tokenExpiry: null,
      last_login: new Date()
    }
  });
}

/**
 * Admin girişi
 */
export async function loginAdminService({ email, password }) {
  const admin = await prisma.admin.findUnique({
    where: { email },
    select: {
      id: true,
      full_name: true,
      email: true,
      password: true,
      account_type: true,
      account_status: true,
      company_name: true,
      company_code: true,
      is_verified: true,
      deleted_at: true
    }
  });

  if (!admin) throw new Error('AUTH_ERROR: E-posta veya şifre hatalı.');
  if (admin.deleted_at) throw new Error('AUTH_ERROR: Bu hesap silinmiş.');
  if (admin.account_status === 'SUSPENDED') throw new Error('AUTH_ERROR: Hesabınız askıya alınmış.');
  if (!admin.is_verified) throw new Error('AUTH_ERROR: Hesabınız doğrulanmamış. Lütfen e-postanızı kontrol edin.');

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) throw new Error('AUTH_ERROR: E-posta veya şifre hatalı.');

  await prisma.admin.update({ where: { id: admin.id }, data: { last_login: new Date() } });

  const { password: _, ...adminData } = admin;
  return adminData;
}

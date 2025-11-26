import prisma from '../../prismaClient.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendEmployeeInvitationEmail } from '../shared/email.service.js';

const SALT_ROUNDS = 10;

/**
 * Çalışan davetiyesi oluşturma
 */
export async function createEmployeeInvitationService(managerId, inviteData) {
  const { invited_email } = inviteData;

  const manager = await prisma.admin.findUnique({
    where: { id: managerId },
    include: {
      companies_managed: {
        where: { deleted_at: null }
      }
    }
  });

  if (!manager) throw new Error('AUTH_ERROR: Yönetici bulunamadı.');
  if (manager.account_type !== 'COMPANY_MANAGER') {
    throw new Error('AUTH_ERROR: Sadece şirket yöneticileri davet gönderebilir.');
  }

  const company = manager.companies_managed[0];
  if (!company) throw new Error('COMPANY_ERROR: Şirket bulunamadı.');

  const inviteCode = `INV-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const inviteLink = `${process.env.FRONTEND_URL}/join-company?code=${inviteCode}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({
    data: {
      company_id: company.id,
      invite_code: inviteCode,
      invite_link: inviteLink,
      invited_email: invited_email || null,
      invited_by: managerId,
      status: 'PENDING',
      expires_at: expiresAt
    }
  });

  if (invited_email) {
    await sendEmployeeInvitationEmail(
      invited_email,
      company.company_name,
      inviteCode,
      inviteLink
    );
  }

  return {
    message: invited_email 
      ? 'Davet e-postası gönderildi.' 
      : 'Davet kodu oluşturuldu. Bu kodu çalışanlarınıza paylaşabilirsiniz.',
    invite_code: inviteCode,
    invite_link: inviteLink,
    expires_at: expiresAt
  };
}

/**
 * Çalışan davetini kabul etme
 */
export async function acceptEmployeeInvitationService(inviteCode, employeeData) {
  const { full_name, email, password } = employeeData;

  const invitation = await prisma.invitation.findUnique({
    where: { invite_code: inviteCode },
    include: {
      company: true
    }
  });

  if (!invitation) throw new Error('INVITE_ERROR: Geçersiz davet kodu.');
  if (invitation.status !== 'PENDING') throw new Error('INVITE_ERROR: Bu davet zaten kullanılmış.');
  if (new Date() > invitation.expires_at) throw new Error('INVITE_ERROR: Davet süresi dolmuş.');

  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (existingAdmin) throw new Error('AUTH_ERROR: Bu e-posta zaten kayıtlı.');

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newEmployee = await prisma.admin.create({
    data: {
      full_name,
      email,
      password: hashedPassword,
      account_type: 'COMPANY_EMPLOYEE',
      account_status: 'ACTIVE',
      company_name: invitation.company.company_name,
      is_verified: true
    }
  });

  await prisma.companyEmployee.create({
    data: {
      admin_id: newEmployee.id,
      company_id: invitation.company_id,
      status: 'ACTIVE'
    }
  });

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      status: 'ACCEPTED',
      used_at: new Date(),
      used_by: newEmployee.id
    }
  });

  return {
    message: `${invitation.company.company_name} şirketine başarıyla katıldınız!`,
    employeeId: newEmployee.id
  };
}

/**
 * Şirket davetlerini listele
 */
export async function getCompanyInvitationsService(managerId) {
  const manager = await prisma.admin.findUnique({
    where: { id: managerId },
    include: {
      companies_managed: {
        where: { deleted_at: null }
      }
    }
  });

  if (!manager) throw new Error('AUTH_ERROR: Yönetici bulunamadı.');
  if (manager.account_type !== 'COMPANY_MANAGER') {
    throw new Error('AUTH_ERROR: Sadece şirket yöneticileri davetleri görüntüleyebilir.');
  }

  const company = manager.companies_managed[0];
  if (!company) throw new Error('COMPANY_ERROR: Şirket bulunamadı.');

  const invitations = await prisma.invitation.findMany({
    where: {
      company_id: company.id
    },
    include: {
      inviter: {
        select: {
          full_name: true,
          email: true
        }
      },
      user: {
        select: {
          full_name: true,
          email: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  return invitations;
}
import prisma from '../../../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendEmployeeInvitationEmail } from '../../../shared/email.service.js';

const SALT_ROUNDS = 10;

/**
 * Çalışan davetiyesi oluşturma
 */
export async function createEmployeeInvitationService(managerId, invitedEmail = null) {
  try {
    // Manager'ı ve şirketini al
    const manager = await prisma.admin.findUnique({
      where: { id: managerId },
      include: {
        company: true
      }
    });

    if (!manager) {
      throw new Error('AUTH_ERROR: Yönetici bulunamadı.');
    }

    if (manager.account_type !== 'COMPANY_MANAGER') {
      throw new Error('AUTH_ERROR: Sadece şirket yöneticileri davet gönderebilir.');
    }

    if (!manager.company) {
      throw new Error('COMPANY_ERROR: Şirket bulunamadı.');
    }

    // Şirket kodunu al
    const companyCode = manager.company.company_code;
    if (!companyCode) {
      throw new Error('COMPANY_ERROR: Şirket kodu bulunamadı.');
    }

    // Davet kodu oluştur (şirket kodu + random)
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    const inviteCode = `${companyCode}-${randomPart}`;

    // Davet linki oluştur
    const inviteLink = `http://localhost:5000/register-employee.html?inviteCode=${inviteCode}`;

    // Son kullanma tarihi (7 gün sonra)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // invitations tablosuna kaydet
    const invitation = await prisma.invitations.create({
      data: {
        company_id: manager.company.id,
        invited_by: managerId,
        invited_email: invitedEmail,
        invite_code: inviteCode,
        invite_link: inviteLink,
        expires_at: expiresAt,
        status: 'PENDING'
      }
    });

    console.log('✅ Davet oluşturuldu:', {
      invite_code: inviteCode,
      company_code: companyCode,
      invited_email: invitedEmail
    });

    // Email gönder (eğer email verilmişse)
    if (invitedEmail) {
      try {
        await sendEmployeeInvitationEmail(
          invitedEmail,
          manager.company.company_name,
          inviteCode,
          inviteLink
        );
        console.log('✅ Davet maili gönderildi:', invitedEmail);
      } catch (emailError) {
        console.error('⚠️ Email gönderilemedi ama davet oluşturuldu:', emailError);
        // Email hatası davet oluşturmayı engellemez
      }
    }

    return {
      invitation: {
        id: invitation.id,
        invite_code: invitation.invite_code,
        invite_link: invitation.invite_link,
        invited_email: invitation.invited_email,
        expires_at: invitation.expires_at,
        status: invitation.status,
        company_code: companyCode,
        email_sent: invitedEmail ? true : false
      }
    };
  } catch (error) {
    console.error('createEmployeeInvitationService hatası:', error);
    throw error;
  }
}

/**
 * Çalışan davetini kabul etme (Kayıt olma)
 */
export async function acceptEmployeeInvitationService(inviteData) {
  const { invite_code, full_name, email, password } = inviteData;

  console.log('🔍 DEBUG - Gelen invite_code:', invite_code);

  try {
    // 1. Daveti bul ve kontrol et
    const invitation = await prisma.invitations.findUnique({
      where: {
        invite_code: invite_code
      },
      include: {
        companies: true
      }
    });

    if (!invitation) {
      throw new Error('INVITE_ERROR: Geçersiz davet kodu.');
    }

    // Status kontrolü
    if (invitation.status !== 'PENDING') {
      throw new Error('INVITE_ERROR: Bu davet zaten kullanılmış.');
    }

    // Süre kontrolü
    if (new Date() > invitation.expires_at) {
      throw new Error('INVITE_ERROR: Davet süresi dolmuş.');
    }

    // Email kontrolü (eğer davet email'e özel ise)
    if (invitation.invited_email && invitation.invited_email !== email) {
      throw new Error('INVITE_ERROR: Bu davet kodu sadece ' + invitation.invited_email + ' için geçerlidir.');
    }

    // 2. Email kullanımda mı kontrol et
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      throw new Error('AUTH_ERROR: Bu e-posta adresi zaten kayıtlı.');
    }

    // 3. Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Transaction ile admin oluştur ve company_employee ekle
    const result = await prisma.$transaction(async (tx) => {
      // Admin oluştur
      const newAdmin = await tx.admin.create({
        data: {
          full_name,
          email,
          password: hashedPassword,
          account_type: 'COMPANY_EMPLOYEE',
          companyId: invitation.company_id,
          company_name: invitation.companies.company_name,
          company_code: invitation.companies.company_code,
          is_verified: true,
          account_status: 'ACTIVE'
        }
      });

      // company_employees kaydı oluştur
      await tx.company_employees.create({
        data: {
          admin_id: newAdmin.id,
          company_id: invitation.company_id,
          status: 'ACTIVE'
        }
      });

      // Daveti güncelle
      await tx.invitations.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          used_at: new Date(),
          used_by: newAdmin.id
        }
      });

      return {
        admin: newAdmin,
        company: invitation.companies
      };
    });

    console.log('✅ Çalışan başarıyla eklendi:', {
      admin_id: result.admin.id,
      company_id: invitation.company_id,
      email: email
    });

    return {
      message: `${result.company.company_name} şirketine başarıyla katıldınız!`,
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        full_name: result.admin.full_name,
        account_type: result.admin.account_type
      }
    };
  } catch (error) {
    console.error('acceptEmployeeInvitationService hatası:', error);
    throw error;
  }
}

/**
 * Davet kodunu doğrula
 * @param {string} inviteCode
 * @returns {Promise<Object>} Davet bilgileri veya null
 */
export async function verifyEmployeeInvitationService(inviteCode) {
  if (!inviteCode) throw new Error('Davet kodu gereklidir');

  const invitation = await prisma.invitations.findUnique({
    where: { invite_code: inviteCode },
    include: {
      companies: true
    }
  });

  if (!invitation) {
    return null;
  }

  return {
    company: {
      company_name: invitation.companies.company_name,
      company_code: invitation.companies.company_code
    },
    invited_email: invitation.invited_email || null
  };
}

/**
 * Şirket davetlerini listele
 */
export async function getCompanyInvitationsService(managerId) {
  try {
    // Manager'ı ve şirketini al
    const manager = await prisma.admin.findUnique({
      where: { id: managerId },
      include: {
        company: true
      }
    });

    if (!manager) {
      throw new Error('AUTH_ERROR: Yönetici bulunamadı.');
    }

    if (manager.account_type !== 'COMPANY_MANAGER') {
      throw new Error('AUTH_ERROR: Sadece şirket yöneticileri davetleri görüntüleyebilir.');
    }

    if (!manager.company) {
      throw new Error('COMPANY_ERROR: Şirket bulunamadı.');
    }

    // Şirkete ait tüm davetleri getir
    const invitations = await prisma.invitations.findMany({
      where: {
        company_id: manager.company.id
      },
      include: {
        companies: {
          select: {
            id: true,
            company_name: true,
            company_code: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`✅ ${invitations.length} davet bulundu`);

    return invitations;
  } catch (error) {
    console.error('getCompanyInvitationsService hatası:', error);
    throw error;
  }
}

/**
 * Daveti sil (Hard delete)
 * @param {number} invitationId - Silinecek davet ID'si
 * @param {number} companyId - Şirket ID'si (yetki kontrolü için)
 * @returns {Promise<Object>} Silme sonucu
 */
export const deleteInvitationService = async (invitationId, companyId) => {
  try {
    console.log('🔍 Davet siliniyor:', { invitationId, companyId });

    // ✅ DÜZELTİLDİ: managerId yerine companyId kontrolü
    // Daveti bul ve şirkete ait olduğunu kontrol et
    const invitation = await prisma.invitations.findFirst({
      where: { 
        id: invitationId,
        company_id: companyId // ✅ Doğrudan companyId ile kontrol
      }
    });

    if (!invitation) {
      throw new Error('Davet bulunamadı veya bu daveti silme yetkiniz yok');
    }

    console.log('✅ Davet bulundu:', {
      id: invitation.id,
      invite_code: invitation.invite_code,
      status: invitation.status
    });

    // Daveti sil
    const deletedInvitation = await prisma.invitations.delete({
      where: { id: invitationId }
    });

    console.log('✅ Davet silindi:', {
      invitation_id: deletedInvitation.id,
      invite_code: deletedInvitation.invite_code
    });

    return {
      deleted_invitation: {
        id: deletedInvitation.id,
        invite_code: deletedInvitation.invite_code,
        invited_email: deletedInvitation.invited_email,
        status: deletedInvitation.status
      }
    };
  } catch (error) {
    console.error('❌ deleteInvitationService hatası:', error);
    throw error;
  }
};
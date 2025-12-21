// src/services/masterAdmin.auth.service.ts
import prisma from '../../../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../../shared/email.service.js';

const SALT_ROUNDS = 10;

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const TOKEN_EXPIRY_HOURS = parseInt(process.env.TOKEN_EXPIRY_HOURS || "24");

function generateJWT(userId, email, role) {
  return jwt.sign(
    { id: userId, email, master_role: role }, // ✅ role -> master_role
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function generateSecureToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * 🚀 Sistem başlarken Master Admin oluştur (seed)
 */
export async function seedMasterAdmin() {
  const email = process.env.MASTER_ADMIN_EMAIL; 
  const password = process.env.MASTER_ADMIN_PASSWORD;

  try {
    const existingAdmin = await prisma.masterUser.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log('✅ Master admin zaten mevcut:', email);
      return existingAdmin;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const admin = await prisma.masterUser.create({
      data: {
        email,
        full_name: '5W1M',
        password_hash: hashedPassword,
        master_role: 'MASTER_ADMIN',
        is_active: true,
        is_verified: true
      }
    });

    console.log('✅ Master admin oluşturuldu:', email);
    console.log('📧 Email:', email);
    console.log('🔑 Şifre:', password);

    return admin;
  } catch (error) {
    console.error('❌ Master admin seed hatası:', error);
    throw error;
  }
}

export async function loginMasterService({ email, password }) {
  try {
    const user = await prisma.masterUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        full_name: true,
        password_hash: true,
        master_role: true,
        is_active: true,
        is_verified: true,
        deleted_at: true,
        last_login_at: true
      }
    });

    if (!user)
      throw new Error("AUTH_ERROR: E-posta veya şifre hatalı.");

    if (user.deleted_at)
      throw new Error("AUTH_ERROR: Bu hesap silinmiş.");

    if (!user.is_active)
      throw new Error("AUTH_ERROR: Hesabınız aktif değil.");

    if (!user.is_verified)
      throw new Error("AUTH_ERROR: Hesabınız doğrulanmamış.");

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid)
      throw new Error("AUTH_ERROR: E-posta veya şifre hatalı.");

    // Son giriş güncelle
    await prisma.masterUser.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    // JWT
    const token = generateJWT(user.id, user.email, user.master_role);

    // Parolayı kaldır
    const { password_hash, ...cleanUser } = user;

    return {
      token,
      user: cleanUser
    };

  } catch (error) {
    console.error("loginMasterService hatası:", error);
    throw error;
  }
}

export async function inviteMasterUserService(inviterUserId, { email, full_name, role }) {
  try {
    // ...existing code...

    const verificationToken = generateSecureToken();
    const tokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 3600 * 1000);

    const newUser = await prisma.masterUser.create({
      data: {
        email,
        full_name,
        password_hash: "",
        master_role: role,
        is_active: false,
        is_verified: false,
        verificationToken: verificationToken,
        tokenExpiry: tokenExpiry
      }
    });

    // ✅ Backend URL (API endpoint)
    const backendUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationLink = `${backendUrl}/api/auth/master/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Master Portal Davetiyesi",
      html: `
       <h2>Merhaba ${full_name},</h2>
       <p>Master Portal'a <strong>${role}</strong> rolüyle davet edildiniz.</p>
       <p>Hesabınızı doğrulamak için aşağıdaki linke tıklayın:</p>
       <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
         Hesabı Doğrula
       </a>
       <p style="color: #6b7280; font-size: 14px;">Bu link ${TOKEN_EXPIRY_HOURS} saat geçerlidir.</p>
      `
    });

    console.log('🔗 Backend Verification Link:', verificationLink);

    return {
      message: "Kullanıcı davet edildi",
      verificationLink,
      userId: newUser.id,
      email: newUser.email
    };
  } catch (error) {
    console.error('inviteMasterUserService hatası:', error);
    throw error;
  }
}

export async function verifyMasterEmailService(token) {
  try {
    console.log('🔍 Verifying token:', token);
    console.log('🕐 Current time:', new Date().toISOString());

    // Önce token'ı aratalım (expiry kontrolü olmadan)
    const userWithToken = await prisma.masterUser.findFirst({
      where: {
        verificationToken: token
      }
    });

    console.log('📦 User with token:', userWithToken ? {
      id: userWithToken.id,
      email: userWithToken.email,
      tokenExpiry: userWithToken.tokenExpiry,
      is_verified: userWithToken.is_verified
    } : 'NOT FOUND');

    // Şimdi expiry kontrolüyle
    const user = await prisma.masterUser.findFirst({
      where: {
        verificationToken: token,
        tokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      if (userWithToken) {
        if (userWithToken.is_verified) {
          throw new Error("ALREADY_VERIFIED: Bu hesap zaten doğrulanmış.");
        }
        throw new Error("TOKEN_EXPIRED: Token süresi dolmuş.");
      }
      throw new Error("TOKEN_INVALID: Geçersiz token.");
    }

    const updatedUser = await prisma.masterUser.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        verificationToken: null,
        tokenExpiry: null
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        master_role: true,
        is_active: true,
        is_verified: true
      }
    });

    console.log('✅ User verified:', updatedUser.email);

    return {
      message: "E-posta doğrulandı. Lütfen şifrenizi oluşturun.",
      user: updatedUser
    };

  } catch (error) {
    console.error("verifyMasterEmailService hatası:", error);
    throw error;
  }
}

/**
 * 🔐 İlk şifreyi belirle ve hesabı aktifleştir
 */
export async function setInitialPasswordService(userId, password) {
  try {
    const user = await prisma.masterUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        is_verified: true,
        is_active: true,
        password_hash: true
      }
    });

    if (!user)
      throw new Error("AUTH_ERROR: Kullanıcı bulunamadı.");

    if (!user.is_verified)
      throw new Error("AUTH_ERROR: E-posta önce doğrulanmalı.");

    if (user.is_active && user.password_hash)
      throw new Error("AUTH_ERROR: Hesap zaten aktif.");

    // Şifre güvenlik kontrolü
    if (password.length < 8)
      throw new Error("AUTH_ERROR: Şifre en az 8 karakter olmalı.");

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const updatedUser = await prisma.masterUser.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword,
        is_active: true,
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        master_role: true,
        is_active: true,
        is_verified: true
      }
    });

    const jwtToken = generateJWT(updatedUser.id, updatedUser.email, updatedUser.master_role);

    console.log(`✅ Şifre belirlendi ve hesap aktifleşti: ${updatedUser.email}`);

    return {
      message: "Şifreniz başarıyla oluşturuldu. Hesabınız aktif.",
      token: jwtToken,
      user: updatedUser
    };

  } catch (error) {
    console.error("setInitialPasswordService hatası:", error);
    throw error;
  }
}

/**
 * 👥 Tüm master kullanıcıları listele (Tüm roller görebilir)
 */
export async function listMasterUsersService(requesterId, includeDeleted = false) {
  try {
    const requester = await prisma.masterUser.findUnique({
      where: { id: requesterId },
      select: { master_role: true, is_active: true }
    });

    if (!requester || !requester.is_active) {
      throw new Error('AUTH_ERROR: Yetkiniz yok veya hesabınız aktif değil.');
    }

    // Silinmişleri de dahil et
    const users = await prisma.masterUser.findMany({
      where: includeDeleted ? {} : { deleted_at: null },
      select: {
        id: true,
        email: true,
        full_name: true,
        master_role: true,
        is_active: true,
        is_verified: true,
        last_login_at: true,
        created_at: true,
        deleted_at: true // <-- silinmişleri göstermek için ekle
      },
      orderBy: { created_at: 'desc' }
    });

    return {
      users,
      can_edit: requester.master_role === 'MASTER_ADMIN'
    };

  } catch (error) {
    console.error('listMasterUsersService hatası:', error);
    throw error;
  }
}

/**
 * 📋 Bekleyen davetleri listele (Tüm roller görebilir)
 */
export async function listPendingInvitesService(requesterId) {
  try {
    const requester = await prisma.masterUser.findUnique({
      where: { id: requesterId },
      select: { master_role: true, is_active: true }
    });

    if (!requester || !requester.is_active) {
      throw new Error('AUTH_ERROR: Yetkiniz yok veya hesabınız aktif değil.');
    }

    const invites = await prisma.masterUser.findMany({
      where: {
        is_verified: false,
        deleted_at: null
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        master_role: true,
        created_at: true,
        tokenExpiry: true // ✅ zaten doğru
      },
      orderBy: { created_at: 'desc' }
    });

    return {
      invites,
      can_edit: requester.master_role === 'MASTER_ADMIN'
    };

  } catch (error) {
    console.error('listPendingInvitesService hatası:', error);
    throw error;
  }
}

/**
 * 🔄 Kullanıcı rolünü güncelle (Sadece MASTER_ADMIN)
 */
export async function updateMasterUserRoleService(adminId, targetUserId, newRole) {
  try {
    const admin = await prisma.masterUser.findUnique({
      where: { id: adminId },
      select: { master_role: true }
    });

    if (!admin || admin.master_role !== 'MASTER_ADMIN') {
      throw new Error('AUTH_ERROR: Sadece Master Admin rol güncelleyebilir.');
    }

    // ✅ Geçerli roller kontrolü
    const validRoles = ['MASTER_ADMIN', 'DEVELOPER', 'PRODUCT_OWNER', 'BOOKKEEPER', 'SUPPORT'];
    if (!validRoles.includes(newRole)) {
      throw new Error(`AUTH_ERROR: Geçersiz rol. Geçerli roller: ${validRoles.join(', ')}`);
    }

    const updatedUser = await prisma.masterUser.update({
      where: { id: targetUserId },
      data: { 
        master_role: newRole,
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        master_role: true,
        is_active: true
      }
    });

    console.log(`✅ Rol güncellendi: ${updatedUser.email} -> ${newRole}`);
    return updatedUser;

  } catch (error) {
    console.error('updateMasterUserRoleService hatası:', error);
    throw error;
  }
}

/**
 * 🚫 Kullanıcıyı devre dışı bırak (Sadece MASTER_ADMIN)
 */
export async function deactivateMasterUserService(adminId, targetUserId) {
  try {
    const admin = await prisma.masterUser.findUnique({
      where: { id: adminId },
      select: { master_role: true }
    });

    if (!admin || admin.master_role !== 'MASTER_ADMIN') {
      throw new Error('AUTH_ERROR: Sadece Master Admin kullanıcı devre dışı bırakabilir.');
    }

    const deactivatedUser = await prisma.masterUser.update({
      where: { id: targetUserId },
      data: { 
        is_active: false,
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        is_active: true
      }
    });

    console.log(`✅ Kullanıcı devre dışı bırakıldı: ${deactivatedUser.email}`);
    
    return {
      message: 'Kullanıcı başarıyla devre dışı bırakıldı.',
      user: deactivatedUser
    };

  } catch (error) {
    console.error('deactivateMasterUserService hatası:', error);
    throw error;
  }
}

/**
 * ♻️ Kullanıcıyı tekrar aktif et (Sadece MASTER_ADMIN)
 */
export async function reactivateMasterUserService(adminId, targetUserId) {
  try {
    const admin = await prisma.masterUser.findUnique({
      where: { id: adminId },
      select: { master_role: true }
    });

    if (!admin || admin.master_role !== 'MASTER_ADMIN') {
      throw new Error('AUTH_ERROR: Sadece Master Admin kullanıcı aktif edebilir.');
    }

    const reactivatedUser = await prisma.masterUser.update({
      where: { id: targetUserId },
      data: { 
        is_active: true,
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        is_active: true
      }
    });

    console.log(`✅ Kullanıcı tekrar aktif edildi: ${reactivatedUser.email}`);
    
    return {
      message: 'Kullanıcı başarıyla aktif edildi.',
      user: reactivatedUser
    };

  } catch (error) {
    console.error('reactivateMasterUserService hatası:', error);
    throw error;
  }
}

/**
 * 🗑️ Master user'ı soft delete (sadece silinmiş göster)
 * Sadece MASTER_ADMIN
 */
export async function softDeleteMasterUserService(adminId, targetUserId) {
  try {
    const admin = await prisma.masterUser.findUnique({
      where: { id: adminId },
      select: { master_role: true }
    });

    if (!admin || admin.master_role !== 'MASTER_ADMIN') {
      throw new Error('AUTH_ERROR: Sadece Master Admin kullanıcı silebilir.');
    }

    const deletedUser = await prisma.masterUser.update({
      where: { id: targetUserId },
      data: { 
        deleted_at: new Date(),
        is_active: false,
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        full_name: true
      }
    });

    console.log(`✅ Master user soft delete: ${deletedUser.email}`);
    return {
      message: 'Kullanıcı başarıyla soft delete yapıldı.',
      user: deletedUser
    };
  } catch (error) {
    console.error('softDeleteMasterUserService hatası:', error);
    throw error;
  }
}

/**
 * ♻️ Soft delete edilen master user'ı geri yükle
 * Sadece MASTER_ADMIN
 */
export async function restoreMasterUserService(adminId, targetUserId) {
  try {
    const admin = await prisma.masterUser.findUnique({
      where: { id: adminId },
      select: { master_role: true }
    });

    if (!admin || admin.master_role !== 'MASTER_ADMIN') {
      throw new Error('AUTH_ERROR: Sadece Master Admin kullanıcı geri yükleyebilir.');
    }

    // Sadece silinmiş kullanıcılar geri yüklenebilir
    const user = await prisma.masterUser.findUnique({
      where: { id: targetUserId }
    });
    if (!user || !user.deleted_at) {
      throw new Error('AUTH_ERROR: Sadece silinmiş kullanıcılar geri yüklenebilir.');
    }

    const restoredUser = await prisma.masterUser.update({
      where: { id: targetUserId },
      data: { 
        deleted_at: null,
        is_active: true,
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        is_active: true,
        deleted_at: true
      }
    });

    console.log(`✅ Master user restore: ${restoredUser.email}`);
    return {
      message: 'Kullanıcı başarıyla geri yüklendi.',
      user: restoredUser
    };
  } catch (error) {
    console.error('restoreMasterUserService hatası:', error);
    throw error;
  }
}

/**
 * ❌ Master user'ı hard delete (veritabanından tamamen sil)
 * Sadece MASTER_ADMIN
 */
export async function hardDeleteMasterUserService(adminId, targetUserId) {
  try {
    const admin = await prisma.masterUser.findUnique({
      where: { id: adminId },
      select: { master_role: true }
    });

    if (!admin || admin.master_role !== 'MASTER_ADMIN') {
      throw new Error('AUTH_ERROR: Sadece Master Admin kullanıcı tamamen silebilir.');
    }

    // Sadece silinmiş kullanıcılar kalıcı silinebilir
    const user = await prisma.masterUser.findUnique({
      where: { id: targetUserId }
    });
    if (!user || !user.deleted_at) {
      throw new Error('AUTH_ERROR: Sadece silinmiş kullanıcılar kalıcı olarak silinebilir.');
    }

    const deletedUser = await prisma.masterUser.delete({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        full_name: true
      }
    });

    console.log(`❌ Master user hard delete: ${deletedUser.email}`);
    return {
      message: 'Kullanıcı kalıcı olarak silindi.',
      user: deletedUser
    };
  } catch (error) {
    console.error('hardDeleteMasterUserService hatası:', error);
    throw error;
  }
}

/**
 * 👤 Mevcut kullanıcı bilgisini getir
 */
export async function getCurrentMasterUserService(userId) {
  try {
    const user = await prisma.masterUser.findUnique({
      where: { 
        id: userId,
        deleted_at: null
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        master_role: true,
        is_active: true,
        is_verified: true,
        last_login_at: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND: Kullanıcı bulunamadı');
    }

    return user;
  } catch (error) {
    console.error('getCurrentMasterUserService hatası:', error);
    throw error;
  }
}
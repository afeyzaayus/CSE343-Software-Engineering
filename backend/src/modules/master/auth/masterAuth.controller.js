// src/controllers/masterAdmin.auth.controller.js
import {
  seedMasterAdmin,
  loginMasterService,
  inviteMasterUserService,
  verifyMasterEmailService,
  setInitialPasswordService,
  listMasterUsersService,
  listPendingInvitesService,
  updateMasterUserRoleService,
  deactivateMasterUserService,
  reactivateMasterUserService,
  deleteMasterUserService,
  restoreMasterUserService,
  hardDeleteMasterUserService,
  getCurrentMasterUserService
} from './masterAuth.service.js';

/**
 * 🚀 Master Admin Seed
 */
export async function seedMasterAdminController(req, res) {
  try {
    const admin = await seedMasterAdmin();
    res.status(200).json({
      success: true,
      message: 'Master admin başarıyla oluşturuldu veya zaten mevcut.',
      data: {
        email: admin.email,
        full_name: admin.full_name,
        master_role: admin.master_role
      }
    });
  } catch (error) {
    console.error('seedMasterAdminController hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Master admin oluşturulamadı.',
      error: error.message
    });
  }
}

/**
 * 🔐 Master Login
 */
export async function loginMasterController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'E-posta ve şifre gerekli.'
      });
    }

    const result = await loginMasterService({ email, password });

    res.status(200).json({
      success: true,
      message: 'Giriş başarılı.',
      data: result
    });
  } catch (error) {
    console.error('loginMasterController hatası:', error);
    
    const statusCode = error.message.includes('AUTH_ERROR') ? 401 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message.replace('AUTH_ERROR: ', ''),
      error: error.message
    });
  }
}

/**
 * 📧 Kullanıcı Davet Et (Sadece MASTER_ADMIN)
 */
export async function inviteMasterUserController(req, res) {
  try {
    const inviterUserId = req.user.id; // JWT middleware'den gelir
    const { email, full_name, role } = req.body;

    if (!email || !full_name || !role) {
      return res.status(400).json({
        success: false,
        message: 'E-posta, isim ve rol gerekli.'
      });
    }

    const validRoles = ['MASTER_ADMIN', 'DEVELOPER', 'PRODUCT_OWNER', 'BOOKKEEPER', 'SUPPORT'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz rol. Geçerli roller: MASTER_ADMIN, DEVELOPER, PRODUCT_OWNER, BOOKKEEPER, SUPPORT'
      });
    }

    const result = await inviteMasterUserService(inviterUserId, { email, full_name, role });

    res.status(201).json({
      success: true,
      message: 'Davet başarıyla gönderildi.',
      data: result
    });
  } catch (error) {
    console.error('inviteMasterUserController hatası:', error);
    
    const statusCode = error.message.includes('AUTH_ERROR') ? 403 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message.replace('AUTH_ERROR: ', ''),
      error: error.message
    });
  }
}

/**
 * ✅ E-posta Doğrulama (Backend Redirect)
 */
export async function verifyMasterEmailController(req, res) {
  try {
    const { token } = req.query;

    console.log('🔍 Email verification request for token:', token);

    // .env'den FRONTEND_URL al
    const frontendUrl  = 'http://localhost:3000/master';

    if (!token) {
      // Hata sayfasına redirect
      return res.redirect(`${frontendUrl}/verify-error.html?error=missing_token`);
    }

    const result = await verifyMasterEmailService(token);

    console.log('✅ Email verified successfully:', result.user.email);

    // Başarılı - set-password.html sayfasına redirect
    res.redirect(`${frontendUrl}/set-password.html?userId=${result.user.id}`);

  } catch (error) {
    console.error('verifyMasterEmailController hatası:', error);

    const frontendUrl =  'http://localhost:3000/master';

    let errorType = 'invalid_token';
    if (error.message.includes('TOKEN_INVALID')) {
      errorType = 'invalid_token';
    } else if (error.message.includes('ALREADY_VERIFIED')) {
      errorType = 'already_verified';
    }

    res.redirect(`${frontendUrl}/verify-error.html?error=${errorType}`);
  }
}

/**
 * 🔑 İlk Şifre Oluşturma
 */
export async function setInitialPasswordController(req, res) {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID ve şifre gerekli.'
      });
    }

    const result = await setInitialPasswordService(userId, password);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        token: result.token,
        user: result.user
      }
    });
  } catch (error) {
    console.error('setInitialPasswordController hatası:', error);
    
    const statusCode = error.message.includes('AUTH_ERROR') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message.replace('AUTH_ERROR: ', ''),
      error: error.message
    });
  }
}

/**
 * 👥 Tüm Master Kullanıcıları Listele (Tüm roller görebilir)
 */
export async function listMasterUsersController(req, res) {
  try {
    // Add defensive check
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli.'
      });
    }

    const requesterId = req.user.id;

    const result = await listMasterUsersService(requesterId);

    res.status(200).json({
      success: true,
      message: 'Kullanıcılar başarıyla getirildi.',
      data: result
    });
  } catch (error) {
    console.error('listMasterUsersController hatası:', error);
    
    const statusCode = error.message.includes('AUTH_ERROR') ? 403 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message.replace('AUTH_ERROR: ', ''),
      error: error.message
    });
  }
}

/**
 * 📋 Bekleyen Davetleri Listele (Tüm roller görebilir)
 */
export async function listPendingInvitesController(req, res) {
  try {
    // Add defensive check
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli.'
      });
    }

    const requesterId = req.user.id;

    const result = await listPendingInvitesService(requesterId);

    res.status(200).json({
      success: true,
      message: 'Bekleyen davetler başarıyla getirildi.',
      data: result.invites, // invites array'ini direkt gönder
      can_edit: result.can_edit
    });
  } catch (error) {
    console.error('listPendingInvitesController hatası:', error);
    
    const statusCode = error.message.includes('AUTH_ERROR') ? 403 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message.replace('AUTH_ERROR: ', ''),
      error: error.message
    });
  }
}

/**
 * 🔄 Kullanıcı Rolü Güncelle (Sadece MASTER_ADMIN)
 */
export async function updateMasterUserRoleController(req, res) {
  try {
    const adminId = req.user.id; // JWT middleware'den gelir
    const { targetUserId, newRole } = req.body;

    if (!targetUserId || !newRole) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID ve yeni rol gerekli.'
      });
    }

    const validRoles = ['MASTER_ADMIN', 'DEVELOPER', 'PRODUCT_OWNER', 'BOOKKEEPER', 'SUPPORT'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz rol. Geçerli roller: MASTER_ADMIN, DEVELOPER, PRODUCT_OWNER, BOOKKEEPER, SUPPORT'
      });
    }

    const result = await updateMasterUserRoleService(adminId, targetUserId, newRole);

    res.status(200).json({
      success: true,
      message: 'Kullanıcı rolü başarıyla güncellendi.',
      data: result
    });
  } catch (error) {
    console.error('updateMasterUserRoleController hatası:', error);
    
    const statusCode = error.message.includes('AUTH_ERROR') ? 403 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message.replace('AUTH_ERROR: ', ''),
      error: error.message
    });
  }
}

/**
 * 🚫 Kullanıcıyı Devre Dışı Bırak (Sadece MASTER_ADMIN)
 */
export async function deactivateMasterUserController(req, res) {
  try {
    const adminId = req.user.id; // JWT middleware'den gelir
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gerekli.'
      });
    }

    const result = await deactivateMasterUserService(adminId, targetUserId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user
    });
  } catch (error) {
    console.error('deactivateMasterUserController hatası:', error);
    
    const statusCode = error.message.includes('AUTH_ERROR') ? 403 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message.replace('AUTH_ERROR: ', ''),
      error: error.message
    });
  }
}

/**
 * ♻️ Kullanıcıyı Tekrar Aktif Et (Sadece MASTER_ADMIN)
 */
export async function reactivateMasterUserController(req, res) {
  try {
    const adminId = req.user.id; // JWT middleware'den gelir
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gerekli.'
      });
    }

    const result = await reactivateMasterUserService(adminId, targetUserId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user
    });
  } catch (error) {
    console.error('reactivateMasterUserController hatası:', error);
    
    const statusCode = error.message.includes('AUTH_ERROR') ? 403 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message.replace('AUTH_ERROR: ', ''),
      error: error.message
    });
  }
}

/**
 * 🗑️ Kullanıcıyı Soft Delete Et (Sadece MASTER_ADMIN)
 */
export async function deleteMasterUserController(req, res) {
  try {
    const adminId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gerekli.'
      });
    }

    const result = await deleteMasterUserService(adminId, targetUserId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user
    });
  } catch (error) {
    console.error('deleteMasterUserController hatası:', error);

    const statusCode = error.message.includes('AUTH_ERROR') ? 403 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message.replace('AUTH_ERROR: ', ''),
      error: error.message
    });
  }
}

/**
 * ♻️ Silinen Kullanıcıyı Geri Yükle (Sadece MASTER_ADMIN)
 */
export async function restoreMasterUserController(req, res) {
  try {
    const adminId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gerekli.'
      });
    }

    const result = await restoreMasterUserService(adminId, targetUserId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user
    });
  } catch (error) {
    console.error('restoreMasterUserController hatası:', error);

    const statusCode = error.message.includes('AUTH_ERROR') ? 403 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message.replace('AUTH_ERROR: ', ''),
      error: error.message
    });
  }
}

/**
 * ❌ Kullanıcıyı Tamamen Sil (Hard Delete) (Sadece MASTER_ADMIN)
 */
export async function hardDeleteMasterUserController(req, res) {
  try {
    const adminId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gerekli.'
      });
    }

    const result = await hardDeleteMasterUserService(adminId, targetUserId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user
    });
  } catch (error) {
    console.error('hardDeleteMasterUserController hatası:', error);

    const statusCode = error.message.includes('AUTH_ERROR') ? 403 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message.replace('AUTH_ERROR: ', ''),
      error: error.message
    });
  }
}

/**
 * 👤 Mevcut Kullanıcı Bilgisini Getir
 */
export async function getCurrentUserController(req, res) {
  try {
    const user = await getCurrentMasterUserService(req.user.id);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('getCurrentUserController hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Kullanıcı bilgisi alınamadı'
    });
  }
}
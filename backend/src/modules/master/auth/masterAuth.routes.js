// src/routes/masterAdmin.auth.routes.js
import express from 'express';
import {
  seedMasterAdminController,
  loginMasterController,
  inviteMasterUserController,
  verifyMasterEmailController,
  setInitialPasswordController,
  listMasterUsersController,
  listPendingInvitesController,
  updateMasterUserRoleController,
  deactivateMasterUserController,
  reactivateMasterUserController,
  softDeleteMasterUserController,  // eklendi
  restoreMasterUserController,      // eklendi
  hardDeleteMasterUserController,   // eklendi
  getCurrentUserController
} from './masterAuth.controller.js';
import { verifyMaster, verifyMasterAdmin } from './master.middleware.js';


const router = express.Router();

// ========================================
// 🔓 PUBLIC ROUTES (No Auth Required)
// ========================================

/**
 * @route   POST /api/auth/master/login
 * @desc    Master admin girişi
 * @access  Public
 */
router.post('/login', loginMasterController);

/**
 * @route   GET /api/auth/master/verify-email
 * @desc    Email doğrulama (davet linkinden)
 * @access  Public
 */
router.get('/verify-email', verifyMasterEmailController);

/**
 * @route   POST /api/auth/master/set-password
 * @desc    İlk şifreyi belirleme
 * @access  Public
 */
router.post('/set-password', setInitialPasswordController);

// ========================================
// 🔒 PROTECTED ROUTES (Auth Required)
// ========================================

/**
 * @route   GET /api/auth/master/users
 * @desc    Tüm master kullanıcıları listele
 * @access  Private (Any Master User)
 */
router.get('/users', 
  verifyMaster,
  listMasterUsersController
);

/**
 * @route   GET /api/auth/master/invites/pending
 * @desc    Bekleyen davetleri listele
 * @access  Private (Any Master User)
 */
router.get('/invites/pending', 
  verifyMaster, 
  listPendingInvitesController
);

/**
 * @route   GET /api/auth/master/me
 * @desc    Mevcut kullanıcı bilgisini getir
 * @access  Private (tüm master kullanıcılar)
 */
router.get('/me', verifyMaster, getCurrentUserController);

// ========================================
// 🔐 MASTER_ADMIN ONLY ROUTES
// ========================================

/**
 * @route   POST /api/auth/master/invite
 * @desc    Yeni master kullanıcı davet et
 * @access  Private (MASTER_ADMIN only)
 */
router.post('/invite', 
  verifyMasterAdmin, 
  inviteMasterUserController
);

/**
 * @route   PATCH /api/auth/master/users/role
 * @desc    Kullanıcı rolünü güncelle
 * @access  Private (MASTER_ADMIN only)
 */
router.patch('/users/role', 
  verifyMasterAdmin, 
  updateMasterUserRoleController
);

/**
 * @route   PATCH /api/auth/master/users/deactivate
 * @desc    Kullanıcıyı devre dışı bırak
 * @access  Private (MASTER_ADMIN only)
 */
router.patch('/users/deactivate', 
  verifyMasterAdmin, 
  deactivateMasterUserController
);

/**
 * @route   PATCH /api/auth/master/users/reactivate
 * @desc    Kullanıcıyı tekrar aktif et
 * @access  Private (MASTER_ADMIN only)
 */
router.patch('/users/reactivate', 
  verifyMasterAdmin, 
  reactivateMasterUserController
);

/**
 * @route   DELETE /api/auth/master/users
 * @desc    Kullanıcıyı sil (soft delete)
 * @access  Private (MASTER_ADMIN only)
 */
router.delete('/users',
  verifyMasterAdmin,
  softDeleteMasterUserController // soft delete fonksiyonunu kullan!
);

/**
 * @route   PATCH /api/auth/master/users/restore
 * @desc    Silinen kullanıcıyı geri yükle (soft delete geri alma)
 * @access  Private (MASTER_ADMIN only)
 */
router.patch('/users/restore',
  verifyMasterAdmin,
  restoreMasterUserController
);

/**
 * @route   DELETE /api/auth/master/users/hard
 * @desc    Kullanıcıyı tamamen sil (hard delete)
 * @access  Private (MASTER_ADMIN only)
 */
router.delete('/users/hard',
  verifyMasterAdmin,
  hardDeleteMasterUserController
);

export default router;
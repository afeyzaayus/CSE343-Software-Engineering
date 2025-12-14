import express from 'express';
import {
    listAdminComplaintsController,
    getAdminComplaintByIdController,
    updateComplaintStatusController,
    addMasterNoteToComplaintController
} from '../controller/master.complaint.controller.js';

const router = express.Router();

// Tüm admin şikayetlerini listele
router.get('/', listAdminComplaintsController);

// Tek şikayet detay
router.get('/:id', getAdminComplaintByIdController);

// Şikayet durumunu güncelle
router.patch('/:id/status', updateComplaintStatusController);

// Şikayete master notu ekle
router.patch('/:id/master-note', addMasterNoteToComplaintController);

export default router;
import express from 'express';
import {
    createAdminComplaintController,
    updateAdminComplaintController,
    deleteAdminComplaintController,
    getAdminComplaintDetailController,
    getAdminComplaintsListController // Listeleme fonksiyonu eklendi
} from '../controller/admin.complaint.controller.js';

const router = express.Router();

// Admin şikayet oluştur
router.post('/', createAdminComplaintController);

// Admin şikayet güncelle
router.put('/:id', updateAdminComplaintController);

// Admin şikayet sil
router.delete('/:id', deleteAdminComplaintController);

// Admin şikayet detay (master_note dahil)
router.get('/:id', getAdminComplaintDetailController);

// Admin şikayet listele
router.get('/', getAdminComplaintsListController);

export default router;
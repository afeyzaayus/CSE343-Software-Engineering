import {
    createAdminComplaintService,
    updateAdminComplaintService,
    deleteAdminComplaintService,
    getAdminComplaintDetailService,
    getAdminComplaintsListService
} from '../service/admin.complaint.service.js';

/**
 * Admin şikayet oluşturma controller'ı
 */
async function createAdminComplaintController(req, res) {
    try {
        const { adminId, accountType, title, content, category } = req.body;
        if (!adminId || !accountType || !title || !content) {
            return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
        }
        const complaint = await createAdminComplaintService({
            adminId,
            accountType,
            title,
            content,
            category
        });
        return res.status(201).json({ message: 'Şikayet başarıyla oluşturuldu.', complaint });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

/**
 * Admin şikayet güncelleme controller'ı
 */
async function updateAdminComplaintController(req, res) {
    try {
        const complaintId = Number(req.params.id);
        const updateData = req.body;
        const updatedComplaint = await updateAdminComplaintService(complaintId, updateData);
        return res.status(200).json({ message: 'Şikayet güncellendi.', complaint: updatedComplaint });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

/**
 * Admin şikayet silme controller'ı
 */
async function deleteAdminComplaintController(req, res) {
    try {
        const complaintId = Number(req.params.id);
        await deleteAdminComplaintService(complaintId);
        return res.status(200).json({ message: 'Şikayet silindi.' });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

/**
 * Admin şikayet detayını getirme controller'ı (master_note dahil)
 */
async function getAdminComplaintDetailController(req, res) {
    try {
        const complaintId = Number(req.params.id);
        const complaint = await getAdminComplaintDetailService(complaintId);
        if (!complaint) {
            return res.status(404).json({ message: 'Şikayet bulunamadı.' });
        }
        return res.status(200).json({ complaint });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

async function getAdminComplaintsListController(req, res) {
    try {
        // adminId'yi auth'dan veya query/body'den alın (örnek: JWT'den veya req.query.adminId'den)
        // Örneğin JWT ile:
        // const adminId = req.user.id;
        // Eğer query ile geliyorsa:
        const adminId = Number(req.query.adminId);
        if (!adminId) {
            return res.status(400).json({ success: false, message: "adminId zorunludur." });
        }
        const complaints = await getAdminComplaintsListService(adminId);
        return res.status(200).json({
            success: true,
            data: { complaints }
        });
    } catch (error) {
        console.error("Admin şikayet listeleme hatası:", error, error.stack);
        return res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack,
            error: error
        });
    }
}

export {
    createAdminComplaintController,
    updateAdminComplaintController,
    deleteAdminComplaintController,
    getAdminComplaintDetailController,
    getAdminComplaintsListController
};
import {
    listAdminComplaintsService,
    getAdminComplaintByIdService,
    updateComplaintStatusService,
    addMasterNoteToComplaintService
} from '../service/master.complaint.service.js';
const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export async function listAdminComplaintsController(req, res) {
    try {
        const filter = {};
        // Sadece ALL değilse filtre uygula
        if (req.query.status && req.query.status.toUpperCase() !== 'ALL') {
            if (VALID_STATUSES.includes(req.query.status)) {
                filter.status = req.query.status;
            } else {
                return res.status(400).json({ error: 'Geçersiz durum!' });
            }
        }
        // (Arama desteği varsa ekleyin)
        if (req.query.search) {
            filter.OR = [
                { title: { contains: req.query.search, mode: 'insensitive' } },
                { content: { contains: req.query.search, mode: 'insensitive' } }
            ];
        }
        const complaints = await listAdminComplaintsService(filter);
        res.json({ complaints });
    } catch (err) {
        console.error('Şikayet listeleme hatası:', err); // <-- Hata detayını konsola yaz
        res.status(500).json({ error: 'Şikayetler alınamadı', detail: err.message });
    }
}
// Tek şikayet detay
export async function getAdminComplaintByIdController(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ error: 'Geçersiz şikayet ID' });
        const complaint = await getAdminComplaintByIdService(id);
        if (!complaint) return res.status(404).json({ error: 'Şikayet bulunamadı' });
        res.json({ complaint });
    } catch (err) {
        res.status(500).json({ error: 'Şikayet alınamadı', detail: err.message });
    }
}

// Şikayet durumunu güncelle
export async function updateComplaintStatusController(req, res) {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;
        if (!id || !status) return res.status(400).json({ error: 'Geçersiz veri' });
        const updated = await updateComplaintStatusService(id, status);
        res.json({ success: true, updated });
    } catch (err) {
        res.status(500).json({ error: 'Durum güncellenemedi', detail: err.message });
    }
}

// Şikayete master notu ekle
export async function addMasterNoteToComplaintController(req, res) {
    try {
        const id = Number(req.params.id);
        const { note } = req.body;
        if (!id || typeof note !== 'string') return res.status(400).json({ error: 'Geçersiz veri' });
        const updated = await addMasterNoteToComplaintService(id, note);
        res.json({ success: true, updated });
    } catch (err) {
        res.status(500).json({ error: 'Not eklenemedi', detail: err.message });
    }
}
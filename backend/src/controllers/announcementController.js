import {
    createAnnouncementService,
    getAnnouncementsBySiteService,
    getAnnouncementByIdService,
    updateAnnouncementService,
    deleteAnnouncementService
} from '../services/announcementService.js';

// ===== YENİ DUYURU EKLEME (Yetki: Yönetici) =====
export const createAnnouncement = async (req, res) => {
    const { siteId } = req.params;
    const { title, content, start_date, end_date } = req.body;

    // Basit alan doğrulama
    if (!title || !content || !start_date || !end_date) {
        return res.status(400).json({
            message: 'Tüm alanları doldurun (Başlık, İçerik, Başlangıç Tarihi, Bitiş Tarihi).'
        });
    }

    try {
        const newAnnouncement = await createAnnouncementService({
            title,
            content,
            start_date,
            end_date,
            site_id: siteId
        });

        res.status(201).json({
            message: 'Duyuru başarıyla oluşturuldu.',
            announcement: newAnnouncement
        });
    } catch (error) {
        console.error('Duyuru oluşturma hatası:', error.message);

        let status = 500;
        if (error.message.includes('ANNOUNCEMENT_ERROR')) status = 400;

        res.status(status).json({ message: error.message });
    }
};

// ===== BELİRLİ BİR SİTENİN TÜM DUYURULARINI LİSTELEME (Yetki: Yönetici, Kullanıcı) =====
export const getAnnouncementsBySite = async (req, res) => {
    const { siteId } = req.params;

    try {
        const announcements = await getAnnouncementsBySiteService(siteId);

        res.status(200).json({
            message: 'Duyurular başarıyla listelendi.',
            announcements
        });
    } catch (error) {
        console.error('Duyuru listeleme hatası:', error.message);

        let status = 500;
        if (error.message.includes('ANNOUNCEMENT_ERROR')) status = 404;

        res.status(status).json({ message: error.message });
    }
};

// ===== BELİRLİ BİR DUYURUYU GÖRÜNTÜLEME (Yetki: Yönetici, Kullanıcı) =====
export const getAnnouncementById = async (req, res) => {
    const { siteId, announcementId } = req.params;

    try {
        const announcement = await getAnnouncementByIdService(announcementId, siteId);

        res.status(200).json({
            message: 'Duyuru başarıyla getirildi.',
            announcement
        });
    } catch (error) {
        console.error('Duyuru getirme hatası:', error.message);

        let status = 500;
        if (error.message.includes('ANNOUNCEMENT_ERROR')) status = 404;

        res.status(status).json({ message: error.message });
    }
};

// ===== DUYURU GÜNCELLEME (Yetki: Yönetici) =====
export const updateAnnouncement = async (req, res) => {
    const { siteId, announcementId } = req.params;
    const { title, content, start_date, end_date } = req.body;

    // En az bir alan güncellenmelidir
    if (!title && !content && !start_date && !end_date) {
        return res.status(400).json({
            message: 'En az bir alan güncellenmelidir.'
        });
    }

    try {
        const updatedAnnouncement = await updateAnnouncementService(
            announcementId,
            siteId,
            { title, content, start_date, end_date }
        );

        res.status(200).json({
            message: 'Duyuru başarıyla güncellendi.',
            announcement: updatedAnnouncement
        });
    } catch (error) {
        console.error('Duyuru güncelleme hatası:', error.message);

        let status = 500;
        if (error.message.includes('ANNOUNCEMENT_ERROR')) status = 400;

        res.status(status).json({ message: error.message });
    }
};

// ===== DUYURU SİLME (Yetki: Yönetici) =====
export const deleteAnnouncement = async (req, res) => {
    const { siteId, announcementId } = req.params;

    try {
        const result = await deleteAnnouncementService(announcementId, siteId);

        res.status(200).json({
            message: result.message
        });
    } catch (error) {
        console.error('Duyuru silme hatası:', error.message);

        let status = 500;
        if (error.message.includes('ANNOUNCEMENT_ERROR')) status = 404;

        res.status(status).json({ message: error.message });
    }
};
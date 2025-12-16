import {
  createAnnouncementService,
  getAnnouncementsBySiteService,
  getAnnouncementByIdService,
  updateAnnouncementService,
  deleteAnnouncementService
} from './announcement.service.js';

// ==================== Yeni Duyuru Oluştur ====================

/**
 * Yeni duyuru oluştur
 * @route   POST /api/announcements
 * @access  Private (SITE_MANAGER)
 * @body    { title: string, content: string, start_date: date, end_date: date, site_id: string }
 */
export async function createAnnouncement(req, res) {
  try {
    const { siteId } = req.params;
    const { title, content, start_date, end_date, priority } = req.body;

    // Validasyon
    if (!title || !content || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar zorunludur (title, content, start_date, end_date).'
      });
    }

    if (title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Başlık en az 3 karakter olmalıdır.'
      });
    }

    if (content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'İçerik en az 10 karakter olmalıdır.'
      });
    }

    const announcement = await createAnnouncementService({
      ...req.body,
      site_id: siteId
    });

    return res.status(201).json({
      success: true,
      message: 'Duyuru başarıyla oluşturuldu.',
      data: announcement
    });
  } catch (error) {

    if (error.message.startsWith('SITE_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('SITE_ERROR: ', '')
      });
    }

    if (error.message.startsWith('VALIDATION_ERROR:')) {
      return res.status(400).json({
        success: false,
        message: error.message.replace('VALIDATION_ERROR: ', '')
      });
    }

    // Prisma unique constraint hatası
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: `Benzersiz kısıt hatası: ${error.meta?.target?.join(', ') || 'bilinmeyen alan'}. Lütfen ID sequence'ini kontrol edin.`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Duyuru oluşturulurken bir hata oluştu.'
    });
  }
}

// ==================== Site Duyurularını Listele ====================

/**
 * Belirli bir sitenin tüm duyurularını listele
 * @route   GET /api/announcements/site/:site_id
 * @access  Private (SITE_MANAGER)
 */
export async function getAnnouncementsBySite(req, res) {
  try {
    const { siteId } = req.params;

    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: 'Site ID belirtilmelidir.'
      });
    }

    const announcements = await getAnnouncementsBySiteService(siteId);

    return res.status(200).json({
      success: true,
      data: announcements
    });
  } catch (error) {

    if (error.message.startsWith('SITE_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('SITE_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Duyurular getirilirken bir hata oluştu.'
    });
  }
}

// ==================== Tek Duyuru Getir ====================

/**
 * Tek bir duyuruyu getir
 * @route   GET /api/announcements/:id/site/:site_id
 * @access  Private (SITE_MANAGER)
 */
export async function getAnnouncementById(req, res) {
  try {
    const { siteId, id } = req.params;

    if (!id || !siteId) {
      return res.status(400).json({
        success: false,
        message: 'Duyuru ID ve Site ID belirtilmelidir.'
      });
    }

    const announcement = await getAnnouncementByIdService(id, siteId);

    return res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {

    if (error.message.startsWith('SITE_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('SITE_ERROR: ', '')
      });
    }

    if (error.message.startsWith('ANNOUNCEMENT_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('ANNOUNCEMENT_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Duyuru getirilirken bir hata oluştu.'
    });
  }
}

// ==================== Duyuru Güncelle ====================

/**
 * Duyuru güncelle
 * @route   PUT /api/announcements/:id/site/:site_id
 * @access  Private (SITE_MANAGER)
 * @body    { title?: string, content?: string, start_date?: date, end_date?: date }
 */
export async function updateAnnouncement(req, res) {
  try {
    const { siteId, id } = req.params;
    const { title, content, start_date, end_date, priority } = req.body;

    if (!id || !siteId) {
      return res.status(400).json({
        success: false,
        message: 'Duyuru ID ve Site ID belirtilmelidir.'
      });
    }

    if (!title && !content && !start_date && !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek en az bir alan belirtilmelidir.'
      });
    }

    if (title && title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Başlık en az 3 karakter olmalıdır.'
      });
    }

    if (content && content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'İçerik en az 10 karakter olmalıdır.'
      });
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (content) updateData.content = content.trim();
    if (start_date) updateData.start_date = start_date;
    if (end_date) updateData.end_date = end_date;
    if (priority) updateData.priority = priority;

    const announcement = await updateAnnouncementService(id, siteId, updateData);

    return res.status(200).json({
      success: true,
      message: 'Duyuru başarıyla güncellendi.',
      data: announcement
    });
  } catch (error) {

    if (error.message.startsWith('SITE_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('SITE_ERROR: ', '')
      });
    }

    if (error.message.startsWith('ANNOUNCEMENT_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('ANNOUNCEMENT_ERROR: ', '')
      });
    }

    if (error.message.startsWith('VALIDATION_ERROR:')) {
      return res.status(400).json({
        success: false,
        message: error.message.replace('VALIDATION_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Duyuru güncellenirken bir hata oluştu.'
    });
  }
}

// ==================== Duyuru Sil ====================

/**
 * Duyuru sil
 * @route   DELETE /api/announcements/:id/site/:site_id
 * @access  Private (SITE_MANAGER)
 */
export async function deleteAnnouncement(req, res) {
  try {
    const { siteId, id } = req.params;

    if (!id || !siteId) {
      return res.status(400).json({
        success: false,
        message: 'Duyuru ID ve Site ID belirtilmelidir.'
      });
    }

    const result = await deleteAnnouncementService(id, siteId);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {

    if (error.message.startsWith('SITE_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('SITE_ERROR: ', '')
      });
    }

    if (error.message.startsWith('ANNOUNCEMENT_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('ANNOUNCEMENT_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Duyuru silinirken bir hata oluştu.'
    });
  }
}
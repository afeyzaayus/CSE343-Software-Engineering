// Request/Complaints Controller

import complaintsService from './request.service.js';

/**
 * Complaints Controller
 * HTTP request/response handling katmanı
 */

class ComplaintsController {

  /**
   * Tüm şikayetleri getir
   * GET /api/complaints?siteId=1&status=pending&category=maintenance
   */
  async getAllComplaints(req, res) {
    try {
      const { siteId, status, category, userId } = req.query;

      // siteId zorunlu
      if (!siteId) {
        return res.status(400).json({ 
          success: false,
          error: 'siteId parametresi gerekli' 
        });
      }

      const complaints = await complaintsService.getAllComplaints({
        siteId,
        status,
        category,
        userId
      });

      res.json({
        success: true,
        data: complaints,
        count: complaints.length
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Şikayetler getirilemedi',
        message: error.message
      });
    }
  }

  /**
   * Kullanıcının kendi şikayetlerini getir
   * GET /api/complaints/user/:userId?siteId=1
   */
  async getUserComplaints(req, res) {
    try {
      const { userId } = req.params;
      const { siteId } = req.query;

      if (!siteId) {
        return res.status(400).json({
          success: false,
          error: 'siteId parametresi gerekli'
        });
      }

      const complaints = await complaintsService.getUserComplaints(userId, siteId);

      res.json({
        success: true,
        data: complaints,
        count: complaints.length
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Kullanıcı şikayetleri getirilemedi',
        message: error.message
      });
    }
  }

  /**
   * Şikayet detayını getir
   * GET /api/complaints/:id
   */
  async getComplaintById(req, res) {
    try {
      const { id } = req.params;

      const complaint = await complaintsService.getComplaintById(id);

      res.json({
        success: true,
        data: complaint
      });

    } catch (error) {
      
      if (error.message === 'Şikayet bulunamadı') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Şikayet detayı getirilemedi',
        message: error.message
      });
    }
  }

  /**
   * Yeni şikayet oluştur
   * POST /api/complaints
   * Body: { title, content, category, siteId, userId }
   */
  async createComplaint(req, res) {
    try {
      const { title, content, category, siteId, userId } = req.body;

      // Validation
      if (!title || !content || !siteId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Zorunlu alanlar eksik',
          required: ['title', 'content', 'siteId', 'userId']
        });
      }

      const complaint = await complaintsService.createComplaint({
        title,
        content,
        category,
        siteId,
        userId
      });

      res.status(201).json({
        success: true,
        message: 'Şikayet başarıyla oluşturuldu',
        data: complaint
      });

    } catch (error) {
      
      if (error.message === 'Bu site için şikayet oluşturamazsınız') {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Geçersiz kategori') {
        return res.status(400).json({
          success: false,
          error: error.message,
          validCategories: ['MAINTENANCE', 'COMPLAINT', 'REQUEST', 'OTHER']
        });
      }

      res.status(500).json({
        success: false,
        error: 'Şikayet oluşturulamadı',
        message: error.message
      });
    }
  }

  /**
   * Şikayet durumunu güncelle
   * PATCH /api/complaints/:id/status
   * Body: { status }
   */
  async updateComplaintStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status parametresi gerekli'
        });
      }

      const complaint = await complaintsService.updateComplaintStatus(id, status);

      res.json({
        success: true,
        message: 'Şikayet durumu başarıyla güncellendi',
        data: complaint
      });

    } catch (error) {

      if (error.message === 'Şikayet bulunamadı') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Geçersiz durum') {
        return res.status(400).json({
          success: false,
          error: error.message,
          validStatuses: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']
        });
      }

      res.status(500).json({
        success: false,
        error: 'Durum güncellenemedi',
        message: error.message
      });
    }
  }

  /**
   * Şikayeti sil
   * DELETE /api/complaints/:id
   */
  async deleteComplaint(req, res) {
    try {
      const { id } = req.params;

      await complaintsService.deleteComplaint(id);

      res.json({
        success: true,
        message: 'Şikayet başarıyla silindi'
      });

    } catch (error) {

      if (error.message === 'Şikayet bulunamadı') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Şikayet silinemedi',
        message: error.message
      });
    }
  }

  /**
   * Site için şikayet istatistikleri
   * GET /api/complaints/stats/:siteId
   */
  async getComplaintStats(req, res) {
    try {
      const { siteId } = req.params;

      const stats = await complaintsService.getComplaintStats(siteId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'İstatistikler getirilemedi',
        message: error.message
      });
    }
  }
}

export default new ComplaintsController();
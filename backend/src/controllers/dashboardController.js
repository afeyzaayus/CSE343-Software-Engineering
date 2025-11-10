import * as dashboardService from '../services/dashboardService.js';

/**
 * Dashboard istatistiklerini getirir
 * GET /api/sites/:siteId/dashboard
 */
export const getDashboard = async (req, res) => {
  try {
    console.log('--- YENİ İSTEK GELDİ ---');
    console.log('Backend"e gelen ham parametre (req.params.siteId):', req.params.siteId);
    const siteId = parseInt(req.params.siteId);

    // Validasyon
    if (isNaN(siteId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Geçersiz site ID' 
      });
    }

    // Service'den veriyi al
    const dashboardData = await dashboardService.getDashboardStatistics(siteId);

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    
    if (error.message === 'Site bulunamadı') {
      return res.status(404).json({ 
        success: false,
        error: 'Site bulunamadı' 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Dashboard verileri alınırken bir hata oluştu',
      details: error.message 
    });
  }
};

/**
 * Son duyuruları getirir
 * GET /api/sites/:siteId/announcements/recent
 */
export const getRecentAnnouncements = async (req, res) => {
  try {
    const siteId = parseInt(req.params.siteId);
    const limit = parseInt(req.query.limit) || 3;

    if (isNaN(siteId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Geçersiz site ID' 
      });
    }

    const announcements = await dashboardService.getRecentAnnouncements(siteId, limit);

    res.json({
      success: true,
      data: announcements
    });

  } catch (error) {
    console.error('Recent announcements error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Duyurular alınırken bir hata oluştu',
      details: error.message 
    });
  }
};
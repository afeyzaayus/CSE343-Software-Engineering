import {
  getDashboardStatisticsService,
  getRecentAnnouncementsService
} from './dashboard.service.js';

// ==================== Dashboard İstatistikleri ====================

/**
 * Dashboard istatistiklerini getir
 * @route   GET /api/dashboard/statistics/:siteId
 * @access  Private (SITE_MANAGER)
 */
export async function getDashboardStatistics(req, res) {
  try {
    const { siteId } = req.params;

    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: 'Site ID belirtilmelidir.'
      });
    }

    const dashboardData = await getDashboardStatisticsService(siteId);

    return res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get dashboard statistics error:', error);

    if (error.message.startsWith('SITE_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('SITE_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Dashboard istatistikleri getirilirken bir hata oluştu.'
    });
  }
}

// ==================== Son Duyuruları Getir ====================

/**
 * Son duyuruları getir
 * @route   GET /api/dashboard/announcements/:siteId
 * @access  Private (SITE_MANAGER)
 * @query   { limit?: number }
 */
export async function getRecentAnnouncements(req, res) {
  try {
    const { siteId } = req.params;
    const limit = parseInt(req.query.limit) || 3;

    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: 'Site ID belirtilmelidir.'
      });
    }

    if (limit < 1 || limit > 20) {
      return res.status(400).json({
        success: false,
        message: 'Limit 1 ile 20 arasında olmalıdır.'
      });
    }

    const announcements = await getRecentAnnouncementsService(siteId, limit);

    return res.status(200).json({
      success: true,
      data: announcements,
      count: announcements.length
    });
  } catch (error) {
    console.error('Get recent announcements error:', error);

    return res.status(500).json({
      success: false,
      message: 'Son duyurular getirilirken bir hata oluştu.'
    });
  }
}
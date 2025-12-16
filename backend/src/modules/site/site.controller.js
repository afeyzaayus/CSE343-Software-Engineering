import {
  createSiteService,
  updateSiteService,
  getSitesService,
  getSiteByIdService,
  deleteSiteService
} from '../../index.js';

export async function createSite(req, res) {
  try {
    const adminId = req.admin.id; // Middleware'den gelir
    const { site_id, site_name, site_address } = req.body;

    console.log('📝 Site oluşturma isteği:', {
      adminId,
      accountType: req.admin.account_type,
      siteData: { site_id, site_name, site_address }
    });

    // Validation
    if (!site_id || !site_name || !site_address) {
      return res.status(400).json({
        success: false,
        error: 'Site ID, isim ve adres zorunludur.'
      });
    }

    const result = await createSiteService(adminId, {
      site_id,
      site_name,
      site_address
    });

    console.log('✅ Site başarıyla oluşturuldu:', result.site.site_id);

    return res.status(201).json({
      success: true,
      message: result.message,
      data: {
        site: result.site
      }
    });

  } catch (error) {
    console.error('❌ createSite controller hatası:', error);

    if (error.message.includes('SITE_ERROR')) {
      return res.status(409).json({
        success: false,
        error: error.message.replace('SITE_ERROR: ', '')
      });
    }

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(403).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    if (error.message.includes('COMPANY_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('COMPANY_ERROR: ', '')
      });
    }

    if (error.message.includes('VALIDATION_ERROR')) {
      return res.status(400).json({
        success: false,
        error: error.message.replace('VALIDATION_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Site oluşturulurken bir hata oluştu.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * @route   PUT /api/sites/:siteId
 * @desc    Site güncelleme
 * @access  Private (Admin only)
 */
export async function updateSite(req, res) {
  try {
    const adminId = req.admin.id;
    const { siteId } = req.params;
    const { site_name, site_address } = req.body;

    console.log('✏️ Site güncelleme isteği:', {
      adminId,
      accountType: req.admin.account_type,
      siteId,
      updateData: { site_name, site_address }
    });

    if (!siteId) {
      return res.status(400).json({
        success: false,
        error: 'Site ID zorunludur.'
      });
    }

    const result = await updateSiteService(adminId, siteId, {
      site_name,
      site_address
    });

    console.log('✅ Site başarıyla güncellendi:', siteId);

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('❌ updateSite controller hatası:', error);

    if (error.message.includes('SITE_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('SITE_ERROR: ', '')
      });
    }

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(403).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Site güncellenirken bir hata oluştu.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * @route   GET /api/sites
 * @desc    Site listesi getir (Admin'e göre filtreleme)
 * @access  Private (Admin only)
 */
export async function getSites(req, res) {
  try {
    const adminId = req.admin.id;
    const { status, search } = req.query;

    console.log('📋 Site listesi isteniyor:', {
      adminId,
      accountType: req.admin.account_type,
      company_id: req.admin.company_id,
      filters: { status, search }
    });

    const sites = await getSitesService(adminId, { status, search });

    console.log('✅ Siteler başarıyla getirildi. Toplam:', sites.length);

    return res.status(200).json({
      success: true,
      message: 'Siteler başarıyla getirildi.',
      data: {
        sites,
        total: sites.length
      }
    });

  } catch (error) {
    console.error('❌ getSites controller hatası:', error);

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(403).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    if (error.message.includes('COMPANY_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('COMPANY_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Siteler getirilirken bir hata oluştu.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * @route   GET /api/sites/:siteId
 * @desc    Tek bir site detayı getir
 * @access  Private (Admin only)
 */
export async function getSiteById(req, res) {
  try {
    const adminId = req.admin.id;
    const { siteId } = req.params;

    console.log('🔍 Site detayı isteniyor:', {
      adminId,
      accountType: req.admin.account_type,
      siteId
    });

    if (!siteId) {
      return res.status(400).json({
        success: false,
        error: 'Site ID zorunludur.'
      });
    }

    const site = await getSiteByIdService(adminId, siteId);

    console.log('✅ Site detayları başarıyla getirildi:', siteId);

    return res.status(200).json({
      success: true,
      message: 'Site detayları başarıyla getirildi.',
      data: {
        site
      }
    });

  } catch (error) {
    console.error('❌ getSiteById controller hatası:', error);

    if (error.message.includes('SITE_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('SITE_ERROR: ', '')
      });
    }

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(403).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Site detayları getirilirken bir hata oluştu.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * @route   DELETE /api/sites/:siteId
 * @desc    Site silme (soft delete)
 * @access  Private (Admin only)
 */
export async function deleteSite(req, res) {
  try {
    const adminId = req.admin.id;
    const { siteId } = req.params;

    console.log('🗑️ Site silme isteği:', {
      adminId,
      accountType: req.admin.account_type,
      siteId
    });

    if (!siteId) {
      return res.status(400).json({
        success: false,
        error: 'Site ID zorunludur.'
      });
    }

    const result = await deleteSiteService(adminId, siteId);

    console.log('✅ Site başarıyla silindi:', siteId);

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('❌ deleteSite controller hatası:', error);

    if (error.message.includes('SITE_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('SITE_ERROR: ', '')
      });
    }

    if (error.message.includes('AUTH_ERROR')) {
      return res.status(403).json({
        success: false,
        error: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Site silinirken bir hata oluştu.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
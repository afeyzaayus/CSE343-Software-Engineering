import {
  getBlocksBySiteService,
  updateBlockService,
  deleteBlockService,
  recreateBlocksForSite
} from '../../services/index.js';

/**
 * @route   GET /api/sites/:siteId/blocks
 * @desc    Site'ın tüm bloklarını getir
 * @access  Private (Admin only)
 */
export async function getBlocksBySite(req, res) {
  try {
    const { siteId } = req.params;

    if (!siteId) {
      return res.status(400).json({
        success: false,
        error: 'Site ID zorunludur.'
      });
    }

    const blocks = await getBlocksBySiteService(siteId);

    return res.status(200).json({
      success: true,
      message: 'Bloklar başarıyla getirildi.',
      data: {
        blocks,
        total: blocks.length
      }
    });

  } catch (error) {
    console.error('getBlocksBySite controller hatası:', error);

    if (error.message.includes('SITE_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('SITE_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Bloklar getirilirken bir hata oluştu.'
    });
  }
}

/**
 * @route   PUT /api/blocks/:blockId
 * @desc    Blok güncelleme
 * @access  Private (Admin only)
 */
export async function updateBlock(req, res) {
  try {
    const { blockId } = req.params;
    const { block_name } = req.body;

    if (!blockId) {
      return res.status(400).json({
        success: false,
        error: 'Blok ID zorunludur.'
      });
    }

    if (!block_name) {
      return res.status(400).json({
        success: false,
        error: 'Blok ismi zorunludur.'
      });
    }

    const result = await updateBlockService(parseInt(blockId), { block_name });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        block: result.block
      }
    });

  } catch (error) {
    console.error('updateBlock controller hatası:', error);

    if (error.message.includes('BLOCK_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('BLOCK_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Blok güncellenirken bir hata oluştu.'
    });
  }
}

/**
 * @route   DELETE /api/blocks/:blockId
 * @desc    Blok silme (soft delete)
 * @access  Private (Admin only)
 */
export async function deleteBlock(req, res) {
  try {
    const { blockId } = req.params;

    if (!blockId) {
      return res.status(400).json({
        success: false,
        error: 'Blok ID zorunludur.'
      });
    }

    const result = await deleteBlockService(parseInt(blockId));

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('deleteBlock controller hatası:', error);

    if (error.message.includes('BLOCK_ERROR')) {
      return res.status(404).json({
        success: false,
        error: error.message.replace('BLOCK_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Blok silinirken bir hata oluştu.'
    });
  }
}

/**
 * @route   POST /api/sites/:siteId/blocks/recreate
 * @desc    Site bloklarını yeniden oluştur
 * @access  Private (Admin only)
 */
export async function recreateBlocks(req, res) {
  try {
    const { siteId } = req.params;
    const { block_count } = req.body;

    if (!siteId) {
      return res.status(400).json({
        success: false,
        error: 'Site ID zorunludur.'
      });
    }

    if (block_count === undefined || block_count < 0) {
      return res.status(400).json({
        success: false,
        error: 'Blok sayısı zorunludur ve 0 veya daha büyük olmalıdır.'
      });
    }

    const blocks = await recreateBlocksForSite(siteId, parseInt(block_count));

    return res.status(200).json({
      success: true,
      message: 'Bloklar başarıyla yeniden oluşturuldu.',
      data: {
        blocks,
        total: blocks.length
      }
    });

  } catch (error) {
    console.error('recreateBlocks controller hatası:', error);

    return res.status(500).json({
      success: false,
      error: 'Bloklar yeniden oluşturulurken bir hata oluştu.'
    });
  }
}
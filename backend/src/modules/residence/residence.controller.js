import residenceService from './residence.service.js';

class ResidenceController {
  // Get blocks for a site
  async getBlocks(req, res) {
    try {
      const { siteId } = req.params;

      if (!siteId) {
        return res.status(400).json({
          success: false,
          message: 'Site ID is required'
        });
      }

      // Convert site_id (string) to site id (integer) if needed
      let siteIdInt;
      if (isNaN(parseInt(siteId))) {
        const site = await residenceService.getSiteByCode(siteId);
        if (!site) {
          return res.status(404).json({
            success: false,
            message: 'Site bulunamadı: ' + siteId
          });
        }
        siteIdInt = site.id;
      } else {
        siteIdInt = parseInt(siteId);
      }

      const blocks = await residenceService.getBlocksBySiteId(siteIdInt);

      res.status(200).json(blocks);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all residents for a site
  async getResidents(req, res) {
    try {
      const { siteId } = req.params;

      if (!siteId) {
        return res.status(400).json({
          success: false,
          message: 'Site ID is required'
        });
      }

      // Convert site_id (string) to site id (integer) if needed
      let siteIdInt;
      if (isNaN(parseInt(siteId))) {
        const site = await residenceService.getSiteByCode(siteId);
        if (!site) {
          return res.status(404).json({
            success: false,
            message: 'Site bulunamadı: ' + siteId
          });
        }
        siteIdInt = site.id;
      } else {
        siteIdInt = parseInt(siteId);
      }

      const residents = await residenceService.getResidentsBySiteId(siteIdInt);

      res.status(200).json({
        success: true,
        count: residents.length,
        data: residents
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get a single resident (user profile)
  async getResident(req, res) {
    try {
      const { userId } = req.params;

      const resident = await residenceService.getResidentById(userId);

      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: resident
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create a new resident
  async createResident(req, res) {
    try {
      const { siteId } = req.params;

      // Convert site_id (string) to site id (integer)
      let siteIdInt;
      if (isNaN(parseInt(siteId))) {
        // It's a string site_id like "EDLHEE", need to find the integer id
        const site = await residenceService.getSiteByCode(siteId);
        if (!site) {
          return res.status(404).json({
            success: false,
            message: 'Site bulunamadı: ' + siteId
          });
        }
        siteIdInt = site.id;
      } else {
        siteIdInt = parseInt(siteId);
      }

      // Add siteId to the request body
      // Remove id if it exists (should be auto-generated)
      const { id, ...bodyWithoutId } = req.body;

      const residentData = {
        ...bodyWithoutId,
        siteId: siteIdInt
      };

      const resident = await residenceService.createResident(residentData);

      res.status(201).json({
        success: true,
        message: 'Resident created successfully',
        data: resident
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update a resident (admin can update resident count and license plate)
  async updateResident(req, res) {
    try {
      const { siteId, userId } = req.params;

      // Verify the user belongs to this site
      const existingResident = await residenceService.getResidentById(userId);
      if (!existingResident) {
        return res.status(404).json({
          success: false,
          message: 'Resident not found'
        });
      }

      // siteId string olabilir (site_id: "ABCDEF") - integer'a çevir
      let siteIdInt;
      if (typeof siteId === 'string' && isNaN(parseInt(siteId))) {
        // String site_id ise, site tablosundan id'yi bul
        const site = await residenceService.getSiteByCode(siteId);
        if (!site) {
          return res.status(404).json({
            success: false,
            message: 'Site not found'
          });
        }
        siteIdInt = site.id;
      } else {
        siteIdInt = parseInt(siteId);
      }

      if (existingResident.siteId !== siteIdInt) {
        return res.status(403).json({
          success: false,
          message: 'Resident does not belong to this site'
        });
      }

      const resident = await residenceService.updateResident(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Resident updated successfully',
        data: resident
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete a resident
  async deleteResident(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      await residenceService.deleteResident(userId);

      res.status(200).json({
        success: true,
        message: 'Resident deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create a new block
  async createBlock(req, res) {
    try {
      const { siteId } = req.params;

      // Convert site_id (string) to site id (integer)
      let siteIdInt;
      if (isNaN(parseInt(siteId))) {
        const site = await residenceService.getSiteByCode(siteId);
        if (!site) {
          return res.status(404).json({
            success: false,
            message: 'Site bulunamadı: ' + siteId
          });
        }
        siteIdInt = site.id;
      } else {
        siteIdInt = parseInt(siteId);
      }

      const block = await residenceService.createBlock(siteIdInt, req.body);

      res.status(201).json({
        success: true,
        message: 'Blok başarıyla oluşturuldu',
        data: block
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get block statistics
  async getBlockStats(req, res) {
    try {
      const { siteId } = req.params;

      let siteIdInt;
      if (isNaN(parseInt(siteId))) {
        const site = await residenceService.getSiteByCode(siteId);
        if (!site) {
          return res.status(404).json({
            success: false,
            message: 'Site bulunamadı'
          });
        }
        siteIdInt = site.id;
      } else {
        siteIdInt = parseInt(siteId);
      }

      const stats = await residenceService.getBlockStats(siteIdInt);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete a block
  async deleteBlock(req, res) {
    try {
      const { blockId } = req.params;

      if (!blockId) {
        return res.status(400).json({
          success: false,
          message: 'Block ID is required'
        });
      }

      await residenceService.deleteBlock(blockId);

      res.status(200).json({
        success: true,
        message: 'Blok ve bağlı daireler başarıyla silindi'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update a block
  async updateBlock(req, res) {
    try {
      const { blockId } = req.params;

      if (!blockId) {
        return res.status(400).json({
          success: false,
          message: 'Block ID is required'
        });
      }

      const block = await residenceService.updateBlock(blockId, req.body);

      res.status(200).json({
        success: true,
        message: 'Blok başarıyla güncellendi',
        data: block
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete an apartment
  async deleteApartment(req, res) {
    try {
      const { blockId, apartmentNo } = req.params;

      if (!blockId || !apartmentNo) {
        return res.status(400).json({
          success: false,
          message: 'Block ID and Apartment No are required'
        });
      }

      await residenceService.deleteApartment(blockId, apartmentNo);

      res.status(200).json({
        success: true,
        message: 'Daire ve içindeki sakinler başarıyla silindi'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new ResidenceController();
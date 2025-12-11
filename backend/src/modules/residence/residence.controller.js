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
        console.log('🏠 [GET RESIDENTS] Site code converted:', siteId, '->', siteIdInt);
      } else {
        siteIdInt = parseInt(siteId);
      }

      const residents = await residenceService.getResidentsBySiteId(siteIdInt);
      
      console.log('✅ [GET RESIDENTS] Found', residents.length, 'residents for site', siteIdInt);
      
      res.status(200).json({
        success: true,
        count: residents.length,
        data: residents
      });
    } catch (error) {
      console.error('❌ [GET RESIDENTS] Error:', error.message);
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
      
      console.log('🏠 [CREATE RESIDENT] Request received:');
      console.log('  - SiteId:', siteId);
      console.log('  - Request Body:', JSON.stringify(req.body, null, 2));
      
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
        console.log('  - Site code converted:', siteId, '->', siteIdInt);
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
      
      if (id) {
        console.log('  - WARNING: id field removed from request:', id);
      }
      
      console.log('  - Resident Data:', JSON.stringify(residentData, null, 2));
      
      const resident = await residenceService.createResident(residentData);
      
      console.log('✅ [CREATE RESIDENT] Success:', resident.id);
      
      res.status(201).json({
        success: true,
        message: 'Resident created successfully',
        data: resident
      });
    } catch (error) {
      console.error('❌ [CREATE RESIDENT] Error:', error.message);
      console.error('   Stack:', error.stack);
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
      const { id } = req.params;
      
      await residenceService.deleteResident(id);
      
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
}

export default new ResidenceController();

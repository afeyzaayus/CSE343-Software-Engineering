const residenceService = require('../services/residenceService');

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

      const blocks = await residenceService.getBlocksBySiteId(siteId);
      
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

      const residents = await residenceService.getResidentsBySiteId(siteId);
      
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
      
      // Add siteId to the request body
      const residentData = {
        ...req.body,
        siteId: parseInt(siteId)
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

      if (existingResident.siteId !== parseInt(siteId)) {
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

module.exports = new ResidenceController();

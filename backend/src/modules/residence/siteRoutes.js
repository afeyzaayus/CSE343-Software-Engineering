const express = require('express');
const router = express.Router();
const residenceController = require('../controllers/residenceController');

// GET /api/sites/{siteId}/blocks - Get blocks for a site
router.get('/:siteId/blocks', residenceController.getBlocks);

// GET /api/sites/{siteId}/residents - List all residents in a site (Admin only)
router.get('/:siteId/residents', residenceController.getResidents);

// POST /api/sites/{siteId}/residents - Add new resident (Admin only)
router.post('/:siteId/residents', residenceController.createResident);

// PUT /api/sites/{siteId}/residents/{userId} - Update resident info (Admin only)
router.put('/:siteId/residents/:userId', residenceController.updateResident);

module.exports = router;

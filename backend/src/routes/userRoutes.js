const express = require('express');
const router = express.Router();
const residenceController = require('../controllers/residenceController');

// GET /api/users/{userId} - Get user profile (User or Admin)
router.get('/:userId', residenceController.getResident);

module.exports = router;

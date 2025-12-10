import express from 'express';
import residenceController from './residence.controller.js';

const router = express.Router();

// Site routes - /api/residence/sites/:siteId
router.get('/sites/:siteId/blocks', residenceController.getBlocks);
router.get('/sites/:siteId/residents', residenceController.getResidents);
router.post('/sites/:siteId/residents', residenceController.createResident);
router.put('/sites/:siteId/residents/:userId', residenceController.updateResident);

// User routes - /api/residence/users/:userId
router.get('/users/:userId', residenceController.getResident);

export default router;

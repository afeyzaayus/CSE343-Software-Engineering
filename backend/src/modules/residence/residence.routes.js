import express from 'express';
import residenceController from './residence.controller.js';

const router = express.Router();

// Site routes - /api/residence/sites/:siteId

// Blocks
router.get('/sites/:siteId/blocks', residenceController.getBlocks);
router.post('/sites/:siteId/blocks', residenceController.createBlock);
router.delete('/sites/:siteId/blocks/:blockId', residenceController.deleteBlock);
router.get('/sites/:siteId/block-stats', residenceController.getBlockStats);

// Residents
router.get('/sites/:siteId/residents', residenceController.getResidents);
router.post('/sites/:siteId/residents', residenceController.createResident);
router.put('/sites/:siteId/residents/:userId', residenceController.updateResident);
router.delete('/sites/:siteId/residents/:userId', residenceController.deleteResident);

// User routes - /api/residence/users/:userId
router.get('/users/:userId', residenceController.getResident);

export default router;

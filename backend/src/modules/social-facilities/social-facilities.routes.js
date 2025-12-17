import express from 'express';
import * as controller from './social-facilities.controller.js';

const router = express.Router();

// /api/sites/:siteId/social-amenities
router.get('/site/:siteId/social-amenities', controller.getFacilities);
router.post('/site/:siteId/social-amenities', controller.createFacility);
router.put('/site/:siteId/social-amenities/:facilityId', controller.updateFacility);
router.delete('/site/:siteId/social-amenities/:facilityId', controller.deleteFacility);

export default router;

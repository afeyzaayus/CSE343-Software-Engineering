import express from 'express';
import * as controller from './social-facilities.controller.js';

const router = express.Router();

// /api/sites/:siteId/social-amenities
router.get('/:siteId/social-amenities', controller.getFacilities);
router.post('/:siteId/social-amenities', controller.createFacility);
router.put('/:siteId/social-amenities/:facilityId', controller.updateFacility);
router.delete('/:siteId/social-amenities/:facilityId', controller.deleteFacility);

export default router;

import express from 'express';
import {
    getAllIndividualsHandler,
    getIndividualByIdHandler,
    updateIndividualStatusHandler,
    softDeleteIndividualHandler,
    restoreIndividualHandler,
    hardDeleteIndividualHandler,
    getIndividualStatisticsHandler,
    getSitesByIndividualIdHandler,
    updateSiteStatusHandler,
    softDeleteSiteHandler,
    restoreSiteHandler,
    hardDeleteSiteHandler
} from './individual.controller.js';

const router = express.Router();

// Bireysel hesap routes
router.get('/', getAllIndividualsHandler);
router.get('/statistics', getIndividualStatisticsHandler);
router.get('/:id', getIndividualByIdHandler);
router.patch('/:id/status', updateIndividualStatusHandler);
router.delete('/:id/soft', softDeleteIndividualHandler);
router.patch('/:id/restore', restoreIndividualHandler);
router.delete('/:id/hard', hardDeleteIndividualHandler);

// Site routes (bireysel hesaba bağlı)
router.get('/:id/site', getSitesByIndividualIdHandler);
router.patch('/sites/:siteId/status', updateSiteStatusHandler);
router.delete('/sites/:siteId/soft', softDeleteSiteHandler);
router.patch('/sites/:siteId/restore', restoreSiteHandler);
router.delete('/sites/:siteId/hard', hardDeleteSiteHandler);

export default router;
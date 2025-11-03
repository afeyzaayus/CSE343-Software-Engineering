// backend/src/residents/residentController.js

import {
    getAllResidentsBySiteService,
    updateResidentDetailsService
} from './residentService.js';

// @desc    Bir sitedeki tüm sakinleri getir
// @route   GET /api/sites/:siteId/residents
// @access  Private/Admin
export const getAllResidentsBySite = async (req, res) => {
    try {
        const { siteId } = req.params;
        const residents = await getAllResidentsBySiteService(siteId);
        res.status(200).json(residents);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// @desc    Bir sakinin bilgilerini güncelle
// @route   PUT /api/sites/:siteId/residents/:userId
// @access  Private/Admin
export const updateResidentDetails = async (req, res) => {
    try {
        const { siteId, userId } = req.params;
        const data = req.body; // { apartment, vehicle }

        const updatedResident = await updateResidentDetailsService(siteId, userId, data);
        res.status(200).json({
            message: 'Sakin bilgileri başarıyla güncellendi.',
            resident: updatedResident
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
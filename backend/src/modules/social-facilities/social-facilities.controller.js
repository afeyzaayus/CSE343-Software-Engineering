import * as service from './social-facilities.service.js';

export async function getFacilities(req, res) {
  const { siteId } = req.params;
  try {
    const facilities = await service.getFacilities(siteId);
    res.json({ success: true, data: facilities });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching facilities', error: err.message });
  }
}

export async function createFacility(req, res) {
  const { siteId } = req.params;
  try {
    const facility = await service.createFacility(siteId, req.body);
    res.status(201).json({ success: true, data: facility });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating facility', error: err.message });
  }
}

export async function updateFacility(req, res) {
  const { siteId, facilityId } = req.params;
  try {
    const updated = await service.updateFacility(siteId, facilityId, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating facility', error: err.message });
  }
}

export async function deleteFacility(req, res) {
  const { siteId, facilityId } = req.params;
  try {
    await service.deleteFacility(siteId, facilityId);
    res.json({ success: true, message: 'Facility deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting facility', error: err.message });
  }
}

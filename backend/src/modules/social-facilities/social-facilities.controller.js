import * as service from './social-facilities.service.js';

export async function getFacilities(req, res) {
  const { siteId } = req.params;
  try {
    const facilities = await service.getFacilities(siteId);
    res.json(facilities);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching facilities', error: err.message });
  }
}

export async function createFacility(req, res) {
  const { siteId } = req.params;
  // 👈 KRİTİK HATA AYIKLAMA KODU BURAYA
  console.log('*** Facility Create Request ***');
  console.log('Site ID (Parametreden):', siteId);
  console.log('Gelen Gövde (req.body):', req.body);
  console.log('*****************************');
  // 👆 KRİTİK HATA AYIKLAMA KODU BURAYA
  try {
    const facility = await service.createFacility(siteId, req.body);
    res.status(201).json(facility);
  } catch (err) {
    res.status(500).json({ message: 'Error creating facility', error: err.message });
  }
}

export async function updateFacility(req, res) {
  const { siteId, facilityId } = req.params;
  try {
    const updated = await service.updateFacility(siteId, facilityId, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating facility', error: err.message });
  }
}

export async function deleteFacility(req, res) {
  const { siteId, facilityId } = req.params;
  try {
    await service.deleteFacility(siteId, facilityId);
    res.json({ message: 'Facility deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting facility', error: err.message });
  }
}

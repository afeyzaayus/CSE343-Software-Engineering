import * as service from './social-facilities.service.js';

export async function getFacilities(req, res) {
  const { siteId } = req.params;
  console.log('📥 [GET FACILITIES] siteId:', siteId);
  try {
    const facilities = await service.getFacilities(siteId);
    console.log('✅ [GET FACILITIES] Sonuç:', facilities.length, 'adet');
    res.json({ success: true, data: facilities });
  } catch (err) {
    console.error('❌ [GET FACILITIES] Hata:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching facilities', error: err.message });
  }
}

export async function createFacility(req, res) {
  const { siteId } = req.params;
  console.log('📥 [CREATE FACILITY] siteId:', siteId);
  console.log('📥 [CREATE FACILITY] body:', JSON.stringify(req.body, null, 2));
  try {
    const facility = await service.createFacility(siteId, req.body);
    console.log('✅ [CREATE FACILITY] Oluşturuldu:', facility.id);
    res.status(201).json({ success: true, data: facility });
  } catch (err) {
    console.error('❌ [CREATE FACILITY] Hata:', err.message);
    console.error('❌ [CREATE FACILITY] Stack:', err.stack);
    res.status(500).json({ success: false, message: 'Error creating facility', error: err.message });
  }
}

export async function updateFacility(req, res) {
  const { siteId, facilityId } = req.params;
  console.log('📥 [UPDATE FACILITY] siteId:', siteId, 'facilityId:', facilityId);
  console.log('📥 [UPDATE FACILITY] body:', JSON.stringify(req.body, null, 2));
  try {
    const updated = await service.updateFacility(siteId, facilityId, req.body);
    console.log('✅ [UPDATE FACILITY] Güncellendi:', updated.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('❌ [UPDATE FACILITY] Hata:', err.message);
    res.status(500).json({ success: false, message: 'Error updating facility', error: err.message });
  }
}

export async function deleteFacility(req, res) {
  const { siteId, facilityId } = req.params;
  console.log('📥 [DELETE FACILITY] siteId:', siteId, 'facilityId:', facilityId);
  try {
    await service.deleteFacility(siteId, facilityId);
    console.log('✅ [DELETE FACILITY] Silindi:', facilityId);
    res.json({ success: true, message: 'Facility deleted' });
  } catch (err) {
    console.error('❌ [DELETE FACILITY] Hata:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting facility', error: err.message });
  }
}

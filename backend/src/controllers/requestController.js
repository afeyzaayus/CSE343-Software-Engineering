import {
  createRequestService,
  getSiteRequestsService,
  getUserRequestsService,
  updateRequestService
} from '../services/requestService.js';

// ===== Kullanıcı yeni talep oluşturur =====
export async function createRequest(req, res) {
  try {
    const { siteId } = req.params;
    const userId = req.user.id; // userAuth middleware'den geliyor
    const { title, content } = req.body;

    const request = await createRequestService({
      title,
      content,
      site_id: siteId,
      user_id: userId
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ===== Admin siteye ait tüm talepleri görür =====
export async function getSiteRequests(req, res) {
  try {
    const { siteId } = req.params;
    const requests = await getSiteRequestsService(siteId);
    res.status(200).json(requests);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ===== Kullanıcı kendi taleplerini görür =====
export async function getUserRequests(req, res) {
  try {
    const { userId } = req.params;

    // Güvenlik: sadece kendi taleplerini görebilir
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }

    const requests = await getUserRequestsService(userId);
    res.status(200).json(requests);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ===== Admin talep durumunu günceller =====
export async function updateRequestStatus(req, res) {
  try {
    const { siteId, requestId } = req.params;
    const { status, title, content } = req.body;

    const updatedRequest = await updateRequestService(requestId, {
      status,
      title,
      content
    });

    res.status(200).json(updatedRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

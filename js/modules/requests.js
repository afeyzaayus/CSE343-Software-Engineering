// js/modules/requests.js
import { getAuthToken } from './auth.js';

const API_BASE = '/api/sites';

// Kullanıcının kendi taleplerini alma
async function fetchUserRequests(userId) {
    try {
        const res = await fetch(`/api/users/${userId}/requests`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Talepler alınamadı');
        }
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Yöneticinin site taleplerini alma
async function fetchSiteRequests(siteId) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/requests`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Site talepleri alınamadı');
        }
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Kullanıcının yeni talep oluşturması
async function createRequest(siteId, requestData) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Talep oluşturulamadı');
        }

        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// Yöneticinin talep durumunu güncellemesi
async function updateRequestStatus(siteId, requestId, status) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/requests/${requestId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Talep durumu güncellenemedi');
        }

        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// DOM ve event listener ayarları
function setupRequests() {
    const siteId = sessionStorage.getItem('siteId');
    const userId = sessionStorage.getItem('userId');
    if (!siteId || !userId) {
        console.error('Site ID veya User ID bulunamadı!');
        return;
    }

    const requestsContainer = document.querySelector('#requests-list');
    const createBtn = document.querySelector('#create-request-btn');
    const isAdmin = sessionStorage.getItem('role') === 'admin';

    if (isAdmin) {
        // Yönetici site taleplerini görüntüler
        fetchSiteRequests(siteId).then(requests => {
            requestsContainer.innerHTML = '';
            requests.forEach(r => {
                const div = document.createElement('div');
                div.classList.add('request-item');
                div.dataset.id = r.id;
                div.innerHTML = `
                    <h3>${r.title}</h3>
                    <p>${r.description}</p>
                    <p>Durum: ${r.status}</p>
                    <button class="update-status-btn">Durumu Güncelle</button>
                `;
                requestsContainer.appendChild(div);
            });

            requestsContainer.querySelectorAll('.update-status-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const div = e.target.closest('.request-item');
                    const requestId = div.dataset.id;
                    const newStatus = prompt('Yeni Durum (Beklemede/Çözüldü/İşlemde):', 'Beklemede');
                    if (!newStatus) return;
                    await updateRequestStatus(siteId, requestId, newStatus);
                    div.querySelector('p:nth-child(3)').textContent = `Durum: ${newStatus}`;
                });
            });
        });
    } else {
        // Kullanıcı kendi taleplerini görüntüler
        fetchUserRequests(userId).then(requests => {
            requestsContainer.innerHTML = '';
            requests.forEach(r => {
                const div = document.createElement('div');
                div.classList.add('request-item');
                div.dataset.id = r.id;
                div.innerHTML = `
                    <h3>${r.title}</h3>
                    <p>${r.description}</p>
                    <p>Durum: ${r.status}</p>
                `;
                requestsContainer.appendChild(div);
            });
        });

        // Kullanıcı yeni talep oluşturabilir
        if (createBtn) {
            createBtn.addEventListener('click', async () => {
                const title = prompt('Talep Başlığı:');
                const description = prompt('Talep Açıklaması:');
                if (!title || !description) return;

                const newRequest = await createRequest(siteId, { title, description });
                const div = document.createElement('div');
                div.classList.add('request-item');
                div.dataset.id = newRequest.id;
                div.innerHTML = `
                    <h3>${newRequest.title}</h3>
                    <p>${newRequest.description}</p>
                    <p>Durum: ${newRequest.status}</p>
                `;
                requestsContainer.appendChild(div);
            });
        }
    }
}

export { setupRequests, fetchUserRequests, fetchSiteRequests, createRequest, updateRequestStatus };

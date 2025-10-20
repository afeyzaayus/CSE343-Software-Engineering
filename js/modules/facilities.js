// js/modules/facilities.js
import { getAuthToken } from './auth.js';

const API_BASE = '/api/sites';

// Tüm sosyal tesisleri çekme
async function fetchFacilities(siteId) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/social-amenities`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Sosyal tesisler alınamadı');
        }

        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Yeni sosyal tesis ekleme (Yönetici)
async function createFacility(siteId, facilityData) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/social-amenities`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(facilityData)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Sosyal tesis eklenemedi');
        }

        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// Sosyal tesisi güncelleme (Yönetici)
async function updateFacility(siteId, facilityId, facilityData) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/social-amenities/${facilityId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(facilityData)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Sosyal tesis güncellenemedi');
        }

        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// Sosyal tesisi silme (Yönetici)
async function deleteFacility(siteId, facilityId) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/social-amenities/${facilityId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Sosyal tesis silinemedi');
        }

        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

// DOM ile ilişkilendirme ve event listener ekleme
function setupFacilities() {
    const siteId = sessionStorage.getItem('siteId');
    if (!siteId) {
        console.error('Site ID bulunamadı!');
        return;
    }

    const facilitiesContainer = document.querySelector('#facilities-list');
    const createBtn = document.querySelector('#create-facility-btn');

    // Tüm sosyal tesisleri yükle
    fetchFacilities(siteId).then(facilities => {
        facilitiesContainer.innerHTML = '';
        facilities.forEach(f => {
            const div = document.createElement('div');
            div.classList.add('facility-item');
            div.dataset.id = f.id;
            div.innerHTML = `
                <h3>${f.name}</h3>
                <p>${f.description}</p>
                <small>${f.location || ''}</small>
                <button class="edit-btn">Düzenle</button>
                <button class="delete-btn">Sil</button>
            `;
            facilitiesContainer.appendChild(div);
        });

        // Silme ve düzenleme butonları
        facilitiesContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const facilityId = e.target.closest('.facility-item').dataset.id;
                const success = await deleteFacility(siteId, facilityId);
                if (success) e.target.closest('.facility-item').remove();
            });
        });

        facilitiesContainer.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const item = e.target.closest('.facility-item');
                const facilityId = item.dataset.id;
                const newName = prompt('Yeni isim:', item.querySelector('h3').textContent);
                const newDesc = prompt('Yeni açıklama:', item.querySelector('p').textContent);

                if (newName && newDesc) {
                    await updateFacility(siteId, facilityId, { name: newName, description: newDesc });
                    item.querySelector('h3').textContent = newName;
                    item.querySelector('p').textContent = newDesc;
                }
            });
        });
    });

    // Yeni sosyal tesis ekleme
    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            const name = prompt('Tesis adı:');
            const description = prompt('Açıklama:');
            if (!name || !description) return;

            const newFacility = await createFacility(siteId, { name, description });
            const div = document.createElement('div');
            div.classList.add('facility-item');
            div.dataset.id = newFacility.id;
            div.innerHTML = `
                <h3>${newFacility.name}</h3>
                <p>${newFacility.description}</p>
                <small>${newFacility.location || ''}</small>
                <button class="edit-btn">Düzenle</button>
                <button class="delete-btn">Sil</button>
            `;
            facilitiesContainer.appendChild(div);
        });
    }
}

export { setupFacilities, fetchFacilities, createFacility, updateFacility, deleteFacility };

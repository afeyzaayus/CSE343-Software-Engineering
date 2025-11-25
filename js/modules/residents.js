import { getAuthToken } from './auth.js';
import { openModal, closeModal } from './ui.js';

const API_BASE = '/api/sites';
const SITE_ID = localStorage.getItem('selectedSite');
const USER_ID = localStorage.getItem('userId');
const ROLE = localStorage.getItem('role'); // 'admin' veya 'user'

// --- API Fonksiyonları ---

async function fetchResidents(siteId) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/residents`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error('Sakinler alınamadı');
        return await res.json();
    } catch (err) {
        console.error(err);
        alert(err.message);
        return [];
    }
}

async function fetchUserProfile(userId) {
    try {
        const res = await fetch(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error('Profil bilgileri alınamadı');
        return await res.json();
    } catch (err) {
        console.error(err);
        alert(err.message);
        return null;
    }
}

async function fetchBlocks(siteId) {
    // 💡 GÜNCELLEME: siteId'nin geçerli olup olmadığını kontrol et
    if (!siteId || siteId === 'null') {
        console.warn("Site ID bulunamadığı veya geçersiz olduğu için bloklar yüklenemedi.");
        return []; 
    }

    try {
        const res = await fetch(`${API_BASE}/${siteId}/blocks`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            // Sunucudan gelen hata mesajını daha spesifik görmek için log ekleyebiliriz
            console.error(`Bloklar alınamadı. HTTP Durumu: ${res.status}`);
            throw new Error('Bloklar alınamadı');
        }
        
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

async function updateResident(siteId, userId, data) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/residents/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Güncelleme başarısız');
        }
        return await res.json();
    } catch (err) {
        console.error(err);
        alert(err.message);
        throw err;
    }
}

// --- UI Fonksiyonları ---

async function renderResidents() {
    const container = document.querySelector('#residents-table-body');
    if (!SITE_ID || !USER_ID) return;

    container.innerHTML = '<tr><td colspan="8" style="text-align:center;">Veriler yükleniyor...</td></tr>';

    let residents = [];
    if (ROLE === 'admin') {
        residents = await fetchResidents(SITE_ID);
    } else {
        const profile = await fetchUserProfile(USER_ID);
        if (profile) residents = [profile];
    }

    const blockSelect = document.getElementById('blockFilter');
    const selectedBlock = blockSelect.value;
    if (selectedBlock) {
        residents = residents.filter(r => r.block === selectedBlock);
    }

    container.innerHTML = '';
    if (residents.length === 0) {
        container.innerHTML = '<tr><td colspan="8" style="text-align:center;">Sakin bulunamadı</td></tr>';
        return;
    }

    residents.forEach(resident => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${resident.apartment}</td>
            <td>${resident.block}</td>
            <td>${resident.fullName}</td>
            <td>${resident.phone || '-'}</td>
            <td>${resident.vehicle || '-'}</td>
            <td>${resident.numPeople || '-'}</td>
            <td>${resident.status || '-'}</td>
            <td>
                ${ROLE === 'admin' ? `<button class="edit-btn" data-id="${resident.id}">Güncelle</button>` : '-'}
            </td>
        `;
        container.appendChild(tr);

        if (ROLE === 'admin') {
            const editBtn = tr.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', async () => {
                    const newApartment = prompt('Daire numarası:', resident.apartment);
                    const newVehicle = prompt('Araç plaka:', resident.vehicle || '');
                    if (!newApartment) return;

                    const updated = await updateResident(SITE_ID, resident.id, {
                        apartment: newApartment,
                        vehicle: newVehicle
                    });

                    tr.querySelector('td:nth-child(1)').textContent = updated.apartment;
                    tr.querySelector('td:nth-child(5)').textContent = updated.vehicle || '-';
                });
            }
        }
    });
}

async function populateBlockDropdown() {
    const blockSelect = document.getElementById('blockFilter');
    let blocks = [];

    blocks = await fetchBlocks(SITE_ID);

    if (blocks.length === 0 && ROLE === 'admin') {
        const residents = await fetchResidents(SITE_ID);
        blocks = [...new Set(residents.map(r => r.block))];
    }

    blocks.forEach(block => {
        const option = document.createElement('option');
        option.value = block;
        option.textContent = block + ' Blok';
        blockSelect.appendChild(option);
    });
}

export async function setupResidents() {
    await populateBlockDropdown();
    await renderResidents();
    document.getElementById('blockFilter').addEventListener('change', renderResidents);

    // ============================
    // MODAL AÇ/KAPA
    // ============================
    const addModal = document.getElementById("addApartmentModal");
    const openAddModal = document.getElementById("addResidentBtn");
    const closeAddModal = document.getElementById("closeAddModal");

    if (openAddModal && addModal) {
        openAddModal.addEventListener("click", () => {
            addModal.style.display = "flex"; // modal açılır
        });
    }

    if (closeAddModal && addModal) {
        closeAddModal.addEventListener("click", () => {
            addModal.style.display = "none"; // modal kapanır
        });
    }

    // Modal dışına tıklayınca kapanması
    window.addEventListener("click", (e) => {
        if (e.target === addModal) {
            addModal.style.display = "none";
        }
    });

    // Optional: Form submit sonrası modalı kapat
    const addForm = document.getElementById("addApartmentForm");
    if (addForm) {
        addForm.addEventListener("submit", (e) => {
            e.preventDefault(); // sayfa reload olmasın
            // Burada API call ekleyebilirsin
            alert("Yeni daire kaydedildi!");
            addModal.style.display = "none";
            addForm.reset();
        });
    }
}

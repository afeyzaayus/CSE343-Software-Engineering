import { getAuthToken } from './auth.js';
import { openModal, closeModal } from './ui.js';
import { getCurrentSiteId } from './site.js';

const API_BASE_URL = 'http://localhost:3000/api/residence/sites';
const API_USERS_URL = 'http://localhost:3000/api/residence/users';
const USER_ID = localStorage.getItem('userId');
const ROLE = localStorage.getItem('role'); // 'admin' veya 'user'

// Site ID'yi dinamik olarak al
function getSiteId() {
    const siteId = getCurrentSiteId() || sessionStorage.getItem('siteId');
    if (!siteId) {
        console.error('Site ID bulunamadı! Lütfen önce bir site seçin.');
        return null;
    }
    return siteId;
}

// --- API Fonksiyonları ---

async function fetchResidents(siteId) {
    try {
        const res = await fetch(`${API_BASE_URL}/${siteId}/residents`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error('Sakinler alınamadı');
        const result = await res.json();
        return result.data || [];
    } catch (err) {
        console.error(err);
        alert(err.message);
        return [];
    }
}

async function fetchUserProfile(userId) {
    try {
        const res = await fetch(`${API_USERS_URL}/${userId}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error('Profil bilgileri alınamadı');
        const result = await res.json();
        return result.data || null;
    } catch (err) {
        console.error(err);
        alert(err.message);
        return null;
    }
}

async function fetchBlocks(siteId) {
    if (!siteId || siteId === 'null') {
        console.warn("Site ID bulunamadığı veya geçersiz olduğu için bloklar yüklenemedi.");
        return []; 
    }

    try {
        const res = await fetch(`${API_BASE_URL}/${siteId}/blocks`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            console.error(`Bloklar alınamadı. HTTP Durumu: ${res.status}`);
            throw new Error('Bloklar alınamadı');
        }
        
        const blocks = await res.json();
        return blocks; // Backend'den gelen array direk döndür
    } catch (err) {
        console.error(err);
        return [];
    }
}

async function updateResident(siteId, userId, data) {
    try {
        const res = await fetch(`${API_BASE_URL}/${siteId}/residents/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Güncelleme başarısız');
        }
        const result = await res.json();
        return result.data || null;
    } catch (err) {
        console.error(err);
        alert(err.message);
        throw err;
    }
}

async function createResident(siteId, data) {
    try {
        console.log('📤 [FRONTEND] Creating resident:');
        console.log('  - Site ID:', siteId);
        console.log('  - Data:', data);
        console.log('  - URL:', `${API_BASE_URL}/${siteId}/residents`);
        
        const res = await fetch(`${API_BASE_URL}/${siteId}/residents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('📥 [FRONTEND] Response status:', res.status);
        
        if (!res.ok) {
            const errorData = await res.json();
            console.error('❌ [FRONTEND] Error response:', errorData);
            throw new Error(errorData.message || 'Sakin eklenemedi');
        }
        const result = await res.json();
        console.log('✅ [FRONTEND] Resident created successfully:', result);
        return result.data || null;
    } catch (err) {
        console.error('❌ [FRONTEND] Create resident error:', err);
        alert(err.message);
        throw err;
    }
}

// --- UI Fonksiyonları ---

async function renderResidents() {
    const container = document.querySelector('#residents-table-body');
    
    const SITE_ID = getSiteId();
    console.log('renderResidents called - SITE_ID:', SITE_ID, 'USER_ID:', USER_ID, 'ROLE:', ROLE);

    if (!SITE_ID) {
        container.innerHTML = '<tr><td colspan="8" style="text-align:center; color: red;">Lütfen önce bir site seçin!</td></tr>';
        return;
    }

    container.innerHTML = '<tr><td colspan="8" style="text-align:center;">Veriler yükleniyor...</td></tr>';

    let residents = [];
    
    // Default to admin if no role set
    const userRole = ROLE || 'admin';
    
    if (userRole === 'admin') {
        residents = await fetchResidents(SITE_ID);
        console.log('Fetched residents:', residents);
    } else if (USER_ID) {
        const profile = await fetchUserProfile(USER_ID);
        if (profile) residents = [profile];
    }

    const blockSelect = document.getElementById('blockFilter');
    const selectedBlock = blockSelect.value;
    if (selectedBlock) {
        residents = residents.filter(r => r.block_id == selectedBlock);
    }

    container.innerHTML = '';
    if (residents.length === 0) {
        container.innerHTML = '<tr><td colspan="8" style="text-align:center;">Sakin bulunamadı</td></tr>';
        return;
    }

    residents.forEach(resident => {
        const tr = document.createElement('tr');
        const statusText = resident.resident_type === 'OWNER' ? 'Ev Sahibi' : (resident.resident_type === 'HIRER' ? 'Kiracı' : '-');
        const userRole = ROLE || 'admin';
        
        tr.innerHTML = `
            <td>${resident.apartment_no || '-'}</td>
            <td>${resident.block_name || resident.block_id || '-'}</td>
            <td>${resident.full_name || '-'}</td>
            <td>${resident.phone_number || '-'}</td>
            <td>${resident.plates || '-'}</td>
            <td>${resident.resident_count || 1}</td>
            <td>${statusText}</td>
            <td>
                ${userRole === 'admin' ? `<button class="edit-btn" data-id="${resident.id}">Güncelle</button>` : '-'}
            </td>
        `;
        container.appendChild(tr);

        if (userRole === 'admin') {
            const editBtn = tr.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    openEditModal(resident);
                });
            }
        }
    });
}

async function populateBlockDropdown() {
    const blockSelect = document.getElementById('blockFilter');
    
    // Önce mevcut blok opsiyonlarını temizle (ilk "Tüm Bloklar" dışında)
    blockSelect.innerHTML = '<option value="">Tüm Bloklar</option>';
    
    let blocks = [];

    // Backend'den blokları çek
    blocks = await fetchBlocks(SITE_ID);
    
    console.log('Fetched blocks:', blocks); // Debug için

    // Eğer backend'den blok gelmezse, sakinlerden çıkar
    if (blocks.length === 0) {
        const residents = await fetchResidents(SITE_ID);
        const uniqueBlocks = {};
        residents.forEach(r => {
            if (r.block_id && r.block_name) {
                uniqueBlocks[r.block_id] = r.block_name;
            }
        });
        blocks = Object.entries(uniqueBlocks).map(([id, name]) => ({ id: parseInt(id), block_name: name }));
        console.log('Blocks from residents:', blocks); // Debug için
    }

    blocks.forEach(block => {
        const option = document.createElement('option');
        option.value = block.id;
        option.textContent = block.block_name + ' Blok';
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
    const editModal = document.getElementById("editApartmentModal");
    const openAddModal = document.getElementById("addResidentBtn");
    const closeAddModal = document.getElementById("closeAddModal");
    const closeEditModalBtn = document.getElementById("closeEditModal");

    if (openAddModal && addModal) {
        openAddModal.addEventListener("click", () => {
            addModal.style.display = "flex";
        });
    }

    if (closeAddModal && addModal) {
        closeAddModal.addEventListener("click", () => {
            addModal.style.display = "none";
        });
    }

    if (closeEditModalBtn && editModal) {
        closeEditModalBtn.addEventListener("click", () => {
            editModal.style.display = "none";
        });
    }

    // Modal dışına tıklayınca kapanması
    window.addEventListener("click", (e) => {
        if (e.target === addModal) {
            addModal.style.display = "none";
        }
        if (e.target === editModal) {
            editModal.style.display = "none";
        }
    });

    // Edit modal açma fonksiyonu
    window.openEditModal = function(resident) {
        document.getElementById('editResidentId').value = resident.id;
        document.getElementById('editBlock').value = resident.block_name || 'A';
        document.getElementById('editDoorNo').value = resident.apartment_no || '';
        document.getElementById('editName').value = resident.full_name || '';
        document.getElementById('editPhone').value = resident.phone_number || '';
        document.getElementById('editPlate').value = resident.plates || '';
        document.getElementById('editPeopleCount').value = resident.resident_count || 1;
        document.getElementById('editStatus').value = resident.resident_type || 'OWNER';
        editModal.style.display = "flex";
    };

    // Edit form submit
    const editForm = document.getElementById("editApartmentForm");
    if (editForm) {
        editForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const residentId = document.getElementById('editResidentId').value;
            const data = {
                block_name: document.getElementById('editBlock').value,
                apartment_no: document.getElementById('editDoorNo').value,
                full_name: document.getElementById('editName').value,
                phone_number: document.getElementById('editPhone').value,
                resident_count: parseInt(document.getElementById('editPeopleCount').value) || 1,
                plates: document.getElementById('editPlate').value || null,
                resident_type: document.getElementById('editStatus').value
            };
            
            const SITE_ID = getSiteId();
            if (!SITE_ID) return;
            
            try {
                await updateResident(SITE_ID, residentId, data);
                alert("Sakin başarıyla güncellendi!");
                editModal.style.display = "none";
                await renderResidents();
            } catch (err) {
                console.error('Sakin güncellenirken hata:', err);
            }
        });
    }

    // Form submit - Yeni sakin ekle
    const addForm = document.getElementById("addApartmentForm");
    if (addForm) {
        addForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const formData = new FormData(addForm);
            const data = {
                full_name: formData.get('name'),
                block_name: formData.get('block'),
                apartment_no: formData.get('doorNo'),
                phone_number: formData.get('phone'),
                password: 'default123',
                resident_count: parseInt(formData.get('peopleCount')) || 1,
                plates: formData.get('plate') || null,
                resident_type: formData.get('status') === 'active' ? 'HIRER' : 'OWNER'
            };
            
            console.log('📝 [FORM] Form submitted with data:', data);
            
            const SITE_ID = getSiteId();
            console.log('🏠 [FORM] Site ID:', SITE_ID);
            
            if (!SITE_ID) {
                console.error('❌ [FORM] Site ID bulunamadı!');
                alert('Site ID bulunamadı! Lütfen tekrar giriş yapın.');
                return;
            }
            
            try {
                await createResident(SITE_ID, data);
                console.log('✅ [FORM] Sakin başarıyla eklendi');
                alert("Yeni sakin başarıyla eklendi!");
                addModal.style.display = "none";
                addForm.reset();
                await renderResidents();
            } catch (err) {
                console.error('❌ [FORM] Sakin eklenirken hata:', err);
                alert('Hata: ' + err.message);
            }
        });
    }
}

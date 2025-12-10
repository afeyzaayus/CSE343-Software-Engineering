// Residents Management
const API_BASE_URL = 'http://localhost:3000/api/residence';
const SITE_ID = localStorage.getItem('siteId') || 1;

// Fetch residents
async function fetchResidents(siteId) {
    try {
        const res = await fetch(`${API_BASE_URL}/sites/${siteId}/residents`);
        if (!res.ok) throw new Error('Sakinler alınamadı');
        const result = await res.json();
        return result.data || [];
    } catch (err) {
        console.error('Fetch residents error:', err);
        alert(err.message);
        return [];
    }
}

// Fetch blocks
async function fetchBlocks(siteId) {
    try {
        const res = await fetch(`${API_BASE_URL}/sites/${siteId}/blocks`);
        if (!res.ok) throw new Error('Bloklar alınamadı');
        const blocks = await res.json();
        return blocks || [];
    } catch (err) {
        console.error('Fetch blocks error:', err);
        return [];
    }
}

// Create resident
async function createResident(siteId, data) {
    try {
        const res = await fetch(`${API_BASE_URL}/sites/${siteId}/residents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Sakin eklenemedi');
        }
        const result = await res.json();
        return result.data;
    } catch (err) {
        console.error('Create resident error:', err);
        alert(err.message);
        throw err;
    }
}

// Update resident
async function updateResident(siteId, userId, data) {
    try {
        const res = await fetch(`${API_BASE_URL}/sites/${siteId}/residents/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Güncelleme başarısız');
        }
        const result = await res.json();
        return result.data;
    } catch (err) {
        console.error('Update resident error:', err);
        alert(err.message);
        throw err;
    }
}

// Render residents table
async function renderResidents() {
    const tbody = document.getElementById('residents-table-body');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Yükleniyor...</td></tr>';

    const residents = await fetchResidents(SITE_ID);
    
    tbody.innerHTML = '';
    if (residents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Sakin bulunamadı</td></tr>';
        return;
    }

    residents.forEach(resident => {
        const tr = document.createElement('tr');
        const statusText = resident.resident_type === 'OWNER' ? 'Ev Sahibi' : 
                          resident.resident_type === 'HIRER' ? 'Kiracı' : '-';
        
        tr.innerHTML = `
            <td>${resident.apartment_no || '-'}</td>
            <td>${resident.block_name || '-'}</td>
            <td>${resident.full_name || '-'}</td>
            <td>${resident.phone_number || '-'}</td>
            <td>${resident.plates || '-'}</td>
            <td>${resident.resident_count || 1}</td>
            <td>${statusText}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-btn" data-id="${resident.id}">Düzenle</button>
            </td>
        `;
        tbody.appendChild(tr);

        tr.querySelector('.edit-btn').addEventListener('click', () => {
            openEditModal(resident);
        });
    });
}

// Populate block filter
async function populateBlockFilter() {
    const blockSelect = document.getElementById('blockFilter');
    const blocks = await fetchBlocks(SITE_ID);
    
    blockSelect.innerHTML = '<option value="">Tüm Bloklar</option>';
    blocks.forEach(block => {
        const option = document.createElement('option');
        option.value = block.id;
        option.textContent = block.block_name;
        blockSelect.appendChild(option);
    });
}

// Open add modal
function openAddModal() {
    document.getElementById('addApartmentModal').style.display = 'flex';
}

// Close add modal
function closeAddModal() {
    document.getElementById('addApartmentModal').style.display = 'none';
    document.getElementById('addApartmentForm').reset();
}

// Open edit modal
function openEditModal(resident) {
    document.getElementById('editResidentId').value = resident.id;
    document.getElementById('editBlock').value = resident.block_id;
    document.getElementById('editDoorNo').value = resident.apartment_no;
    document.getElementById('editName').value = resident.full_name;
    document.getElementById('editPhone').value = resident.phone_number;
    document.getElementById('editPlate').value = resident.plates || '';
    document.getElementById('editPeopleCount').value = resident.resident_count || 1;
    document.getElementById('editStatus').value = resident.resident_type || 'HIRER';
    
    document.getElementById('editApartmentModal').style.display = 'flex';
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editApartmentModal').style.display = 'none';
    document.getElementById('editApartmentForm').reset();
}

// Handle add form submit
document.getElementById('addApartmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        block_id: parseInt(formData.get('block')),
        apartment_no: formData.get('doorNo'),
        full_name: formData.get('name'),
        phone_number: formData.get('phone'),
        plates: formData.get('plate') || null,
        resident_count: parseInt(formData.get('peopleCount')),
        resident_type: formData.get('status')
    };

    try {
        await createResident(SITE_ID, data);
        alert('Sakin başarıyla eklendi!');
        closeAddModal();
        renderResidents();
    } catch (err) {
        console.error('Add resident failed:', err);
    }
});

// Handle edit form submit
document.getElementById('editApartmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const residentId = document.getElementById('editResidentId').value;
    const data = {
        block_id: parseInt(document.getElementById('editBlock').value),
        apartment_no: document.getElementById('editDoorNo').value,
        full_name: document.getElementById('editName').value,
        phone_number: document.getElementById('editPhone').value,
        plates: document.getElementById('editPlate').value || null,
        resident_count: parseInt(document.getElementById('editPeopleCount').value),
        resident_type: document.getElementById('editStatus').value
    };

    try {
        await updateResident(SITE_ID, residentId, data);
        alert('Sakin başarıyla güncellendi!');
        closeEditModal();
        renderResidents();
    } catch (err) {
        console.error('Update resident failed:', err);
    }
});

// Event listeners
document.getElementById('addResidentBtn').addEventListener('click', openAddModal);
document.getElementById('closeAddModal').addEventListener('click', closeAddModal);
document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
document.getElementById('blockFilter').addEventListener('change', renderResidents);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    populateBlockFilter();
    renderResidents();
});

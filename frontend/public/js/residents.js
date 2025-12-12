// Residents Management
const API_BASE_URL = 'http://localhost:3000/api/residence';
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const SITE_ID = selectedSite?.site_id;

// Fetch residents
async function fetchResidents(siteId) {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
        const res = await fetch(`${API_BASE_URL}/sites/${siteId}/residents`, { headers });
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
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
        const res = await fetch(`${API_BASE_URL}/sites/${siteId}/blocks`, { headers });
        if (!res.ok) throw new Error('Bloklar alınamadı');
        const blocks = await res.json();
        return blocks || [];
    } catch (err) {
        console.error('Fetch blocks error:', err);
        return [];
    }
}

// Create block
async function createBlock(siteId, data) {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = { 
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
    
    try {
        const res = await fetch(`${API_BASE_URL}/sites/${siteId}/blocks`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Blok oluşturulamadı');
        }
        const result = await res.json();
        return result.data;
    } catch (err) {
        console.error('Create block error:', err);
        alert(err.message);
        throw err;
    }
}

// Delete block
async function deleteBlock(siteId, blockId) {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
        const res = await fetch(`${API_BASE_URL}/sites/${siteId}/blocks/${blockId}`, {
            method: 'DELETE',
            headers
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Blok silinemedi');
        }
        
        return await res.json();
    } catch (err) {
        console.error('Delete block error:', err);
        alert(err.message);
        throw err;
    }
}

// Create resident
async function createResident(siteId, data) {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = { 
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
    
    try {
        const res = await fetch(`${API_BASE_URL}/sites/${siteId}/residents`, {
            method: 'POST',
            headers,
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
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = { 
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
    
    try {
        const res = await fetch(`${API_BASE_URL}/sites/${siteId}/residents/${userId}`, {
            method: 'PUT',
            headers,
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
    if (!SITE_ID) {
        alert('Site seçilmedi. Ana sayfaya yönlendiriliyorsunuz.');
        window.location.href = '/admin-dashboard.html';
        return;
    }
    
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
                <button class="btn btn-sm btn-primary edit-btn" data-id="${resident.id}" style="margin-right: 5px;">Düzenle</button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${resident.id}">Sil</button>
            </td>
        `;
        tbody.appendChild(tr);

        tr.querySelector('.edit-btn').addEventListener('click', () => {
            openEditModal(resident);
        });
        
        tr.querySelector('.delete-btn').addEventListener('click', () => {
            deleteResidentConfirm(resident);
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

// Update block dropdowns in modals
async function updateBlockDropdowns() {
    const blocks = await fetchBlocks(SITE_ID);
    
    // Update add modal dropdown
    const addBlockSelect = document.querySelector('#addApartmentForm select[name="block"]');
    if (addBlockSelect) {
        addBlockSelect.innerHTML = '';
        blocks.forEach(block => {
            const option = document.createElement('option');
            option.value = block.id;
            option.textContent = block.block_name;
            addBlockSelect.appendChild(option);
        });
    }
    
    // Update edit modal dropdown
    const editBlockSelect = document.getElementById('editBlock');
    if (editBlockSelect) {
        const currentValue = editBlockSelect.value;
        editBlockSelect.innerHTML = '';
        blocks.forEach(block => {
            const option = document.createElement('option');
            option.value = block.id;
            option.textContent = block.block_name;
            editBlockSelect.appendChild(option);
        });
        if (currentValue) {
            editBlockSelect.value = currentValue;
        }
    }
}

// Open add modal
async function openAddModal() {
    await updateBlockDropdowns();
    document.getElementById('addApartmentModal').style.display = 'flex';
}

// Close add modal
function closeAddModal() {
    document.getElementById('addApartmentModal').style.display = 'none';
    document.getElementById('addApartmentForm').reset();
}

// Open edit modal
async function openEditModal(resident) {
    await updateBlockDropdowns();
    
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

// Delete resident confirmation
async function deleteResidentConfirm(resident) {
    if (!confirm(`${resident.full_name} sakinini silmek istediğinizden emin misiniz?`)) {
        return;
    }
    
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
        const res = await fetch(`${API_BASE_URL}/sites/${SITE_ID}/residents/${resident.id}`, {
            method: 'DELETE',
            headers
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Silme işlemi başarısız');
        }
        
        alert('Sakin başarıyla silindi!');
        renderResidents();
    } catch (err) {
        console.error('Delete resident error:', err);
        alert(err.message);
    }
}

// Open manage blocks modal
async function openManageBlocksModal() {
    document.getElementById('manageBlocksModal').style.display = 'flex';
    await renderBlocksList();
}

// Render blocks list in management modal
async function renderBlocksList() {
    const blocksList = document.getElementById('blocksList');
    blocksList.innerHTML = '<p style="text-align:center;">Yükleniyor...</p>';
    
    const blocks = await fetchBlocks(SITE_ID);
    
    if (blocks.length === 0) {
        blocksList.innerHTML = '<p style="text-align:center;color:#999;">Henüz blok oluşturulmamış.</p>';
        return;
    }
    
    blocksList.innerHTML = blocks.map(block => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 10px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #2e86c1;">
            <div>
                <h4 style="margin: 0 0 5px 0; color: #2c3e50;">${block.block_name}</h4>
                <p style="margin: 0; font-size: 13px; color: #7f8c8d;">
                    Kapasite: ${block.apartment_count || 0} daire
                </p>
            </div>
            <button onclick="deleteBlockConfirm(${block.id}, '${block.block_name}')" 
                    class="btn btn-sm btn-danger">
                <i class="fas fa-trash"></i> Sil
            </button>
        </div>
    `).join('');
}

// Delete block confirmation
async function deleteBlockConfirm(blockId, blockName) {
    if (!confirm(`"${blockName}" bloğunu ve bu bloktaki tüm daireleri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
        return;
    }
    
    try {
        await deleteBlock(SITE_ID, blockId);
        alert('Blok ve bağlı daireler başarıyla silindi!');
        
        // Reload everything
        await renderBlocksList();
        await populateBlockFilter();
        await updateBlockDropdowns();
        renderResidents();
    } catch (err) {
        console.error('Delete block failed:', err);
    }
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
document.getElementById('createBlockBtn').addEventListener('click', () => {
    document.getElementById('createBlockModal').style.display = 'flex';
});
document.getElementById('closeCreateBlockModal').addEventListener('click', () => {
    document.getElementById('createBlockModal').style.display = 'none';
    document.getElementById('createBlockForm').reset();
});
document.getElementById('manageBlocksBtn').addEventListener('click', openManageBlocksModal);
document.getElementById('closeManageBlocksModal').addEventListener('click', () => {
    document.getElementById('manageBlocksModal').style.display = 'none';
});

// Handle create block form submit
document.getElementById('createBlockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        block_name: formData.get('block_name'),
        apartment_count: parseInt(formData.get('apartment_count')),
        description: formData.get('description') || null
    };

    try {
        await createBlock(SITE_ID, data);
        alert('Blok başarıyla oluşturuldu!');
        document.getElementById('createBlockModal').style.display = 'none';
        document.getElementById('createBlockForm').reset();
        
        // Reload blocks and update dropdowns
        await populateBlockFilter();
        await updateBlockDropdowns();
        renderResidents();
    } catch (err) {
        console.error('Create block failed:', err);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await populateBlockFilter();
    await updateBlockDropdowns();
    renderResidents();
});

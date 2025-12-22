// Residents Management
const API_BASE_URL = 'http://localhost:3000/api/residence';
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const SITE_ID = selectedSite?.site_id;
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const ITEMS_PER_PAGE = 5;

function getRoleText(role) {
    const roleMap = {
        'COMPANY_MANAGER': 'Şirket Yöneticisi',
        'COMPANY_EMPLOYEE': 'Şirket Çalışanı',
        'INDIVIDUAL': 'Bireysel',
    };
    return roleMap[role] || role;
}
// Keep track of expanded blocks and shown items
const blockStates = {};

// Store original data for search
let allResidents = [];
let allBlocks = [];
let currentSearchQuery = '';

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

// Update block
async function updateBlock(siteId, blockId, data) {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
        const res = await fetch(`${API_BASE_URL}/sites/${siteId}/blocks/${blockId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Blok güncellenemedi');
        }
        const result = await res.json();
        return result.data;
    } catch (err) {
        console.error('Update block error:', err);
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

// Delete apartment (and its residents)
async function deleteApartment(siteId, blockId, apartmentNo) {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
        const res = await fetch(`${API_BASE_URL}/sites/${siteId}/apartments/${blockId}/${apartmentNo}`, {
            method: 'DELETE',
            headers
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Daire silinemedi');
        }

        return await res.json();
    } catch (err) {
        console.error('Delete apartment error:', err);
        throw err;
    }
}

// Render residents by blocks
async function renderResidents() {
    if (!SITE_ID) {
        alert('Site seçilmedi. Ana sayfaya yönlendiriliyorsunuz.');
        window.location.href = '/admin-dashboard.html';
        return;
    }

    const container = document.getElementById('blocks-container');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><i class="fas fa-spinner fa-spin"></i> Veriler yükleniyor...</div>';

    try {
        const [residents, blocks] = await Promise.all([
            fetchResidents(SITE_ID),
            fetchBlocks(SITE_ID)
        ]);

        // Store data for search functionality
        allResidents = residents;
        allBlocks = blocks;

        // Apply search filter if there's an active search
        const residentsToDisplay = currentSearchQuery ? filterResidents(residents) : residents;

        // Group residents by block
        const residentsGroupedByBlock = {};
        blocks.forEach(block => {
            residentsGroupedByBlock[block.id] = [];
        });

        residentsToDisplay.forEach(resident => {
            console.log(`   Adding resident: ${resident.full_name} to block ${resident.block_id}, apartment ${resident.apartment_no}`);
            if (residentsGroupedByBlock[resident.block_id]) {
                residentsGroupedByBlock[resident.block_id].push(resident);
            } else {
                console.warn(`   ⚠️ Block ${resident.block_id} not found for resident ${resident.full_name}`);
            }
        });

        container.innerHTML = '';

        if (blocks.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">Henüz blok oluşturulmamış</div>';
            return;
        }

        // Show no results message if searching
        if (currentSearchQuery && residentsToDisplay.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><i class="fas fa-search"></i> Aramanızla eşleşen sakin bulunamadı</div>';
            return;
        }

        // Create block cards
        blocks.forEach(block => {
            const blockResidents = residentsGroupedByBlock[block.id] || [];
            console.log(`🏢 Block: ${block.block_name} (ID: ${block.id}) - Residents: ${blockResidents.length}`);

            // Initialize block state (preserve expanded state if already set)
            if (!blockStates[block.id]) {
                blockStates[block.id] = {
                    expanded: false,
                    itemsShown: ITEMS_PER_PAGE
                };
            }

            const blockCard = createBlockCard(block, blockResidents);
            container.appendChild(blockCard);
        });
    } catch (err) {
        console.error('Render residents error:', err);
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #d32f2f;">Hata: ' + err.message + '</div>';
    }
}

// Create a block card element
function createBlockCard(block, residents) {
    const card = document.createElement('div');
    card.className = 'block-card';
    card.id = `block-${block.id}`;

    const state = blockStates[block.id];

    const header = document.createElement('div');
    header.className = 'block-header';
    header.onclick = () => toggleBlockExpand(block.id);

    // Calculate occupied/empty apartments - count unique apartments with residents
    const occupiedApartments = new Set(residents.map(r => r.apartment_no)).size;
    const totalApartments = block.apartment_count || 0;

    // Calculate total resident count
    const totalResidents = block.resident_count || 0;

    header.innerHTML = `
        <div class="block-header-title">
            <i class="fas fa-building"></i>
            <h3>${block.block_name}</h3>
            <span class="block-count" style="background: rgba(33, 150, 243, 0.3); margin-left: 10px;">Yaşayan kişi: ${totalResidents}</span>
            <span class="block-count" style="background: rgba(76, 175, 80, 0.3);">${occupiedApartments}/${totalApartments} daire dolu</span>
            <button onclick="openAddModalForBlock(${block.id})" class="btn btn-sm btn-success" style="margin-left: 15px;">
                <i class="fas fa-plus"></i> Daire Ekle
            </button>
        </div>
        <i class="fas fa-chevron-down block-toggle-icon" id="toggle-icon-${block.id}"></i>
    `;

    const content = document.createElement('div');
    content.className = `block-content ${state.expanded ? '' : 'collapsed'}`;
    content.id = `content-${block.id}`;

    // Group residents by apartment
    const residentsGroupedByApartment = {};
    residents.forEach(resident => {
        const apartmentNo = resident.apartment_no;
        if (!residentsGroupedByApartment[apartmentNo]) {
            residentsGroupedByApartment[apartmentNo] = [];
        }
        residentsGroupedByApartment[apartmentNo].push(resident);
    });

    const apartmentsContainer = document.createElement('div');
    apartmentsContainer.className = 'apartments-container';

    // Show all apartments from 1 to apartment_count
    const apartmentCount = block.apartment_count || Object.keys(residentsGroupedByApartment).length;
    for (let i = 1; i <= apartmentCount; i++) {
        const apartmentNo = i.toString();
        const apartmentResidents = residentsGroupedByApartment[apartmentNo] || [];

        // If searching, only show apartments with residents
        if (currentSearchQuery && apartmentResidents.length === 0) {
            continue;
        }

        const apartmentCard = createApartmentCard(block, apartmentNo, apartmentResidents);
        apartmentsContainer.appendChild(apartmentCard);
    }

    content.appendChild(apartmentsContainer);

    card.appendChild(header);
    card.appendChild(content);

    return card;
}

// Create apartment card
function createApartmentCard(block, apartmentNo, residents) {
    const card = document.createElement('div');
    card.className = 'apartment-card';

    const header = document.createElement('div');
    header.className = 'apartment-header';

    // Check if this is the last apartment in the block
    const isLastApartment = parseInt(apartmentNo) === (block.apartment_count || 0);

    header.innerHTML = `
        <div class="apartment-header-title">
            <i class="fas fa-door-open"></i>
            <h4>Daire ${apartmentNo}</h4>
            <span class="apartment-resident-count">${residents.length} kişi</span>
        </div>
        ${isLastApartment ? `<button class="btn btn-sm btn-danger" onclick="deleteApartmentConfirm(${block.id}, ${apartmentNo})" title="Daire Sil"><i class="fas fa-trash"></i></button>` : ''}
    `;

    const content = document.createElement('div');
    content.className = 'apartment-content';

    if (residents.length === 0) {
        content.innerHTML = '<div class="empty-apartment"><i class="fas fa-user-slash"></i> Bu dairede sakin bulunmamaktadır</div>';
    } else {
        const residentsDiv = document.createElement('div');
        residentsDiv.className = 'residents-in-apartment';

        residents.forEach(resident => {
            const residentDiv = createResidentInApartmentItem(resident);
            residentsDiv.appendChild(residentDiv);
        });

        content.appendChild(residentsDiv);
    }

    // Add button to add resident to this apartment
    const addResidentDiv = document.createElement('div');
    addResidentDiv.className = 'add-resident-to-apartment';

    const addBtn = document.createElement('button');
    addBtn.innerHTML = '<i class="fas fa-plus"></i> Kişi Ekle';
    addBtn.onclick = () => openAddResidentToApartmentModal(block.id, apartmentNo);

    addResidentDiv.appendChild(addBtn);
    content.appendChild(addResidentDiv);

    card.appendChild(header);
    card.appendChild(content);

    return card;
}

// Create resident item in apartment
function createResidentInApartmentItem(resident) {
    const item = document.createElement('div');
    item.className = 'resident-in-apartment';

    const statusText = resident.resident_type === 'OWNER' ? 'Ev Sahibi' :
        resident.resident_type === 'HIRER' ? 'Kiracı' : '-';
    const statusClass = resident.resident_type === 'OWNER' ? 'owner' : 'hirer';

    const info = document.createElement('div');
    info.className = 'resident-in-apartment-info';

    // Highlight search query in text
    const highlightedName = highlightText(resident.full_name, currentSearchQuery);
    const highlightedPhone = highlightText(resident.phone_number || '-', currentSearchQuery);
    const highlightedPlates = highlightText(resident.plates || '-', currentSearchQuery);

    info.innerHTML = `
        <div class="resident-in-apartment-name">${highlightedName}</div>
        <div class="resident-in-apartment-details">
            <div class="resident-in-apartment-detail">
                <i class="fas fa-phone" style="color: #2e86c1;"></i>
                <span>${highlightedPhone}</span>
            </div>
            <div class="resident-in-apartment-detail">
                <i class="fas fa-car" style="color: #2e86c1;"></i>
                <span>${highlightedPlates}</span>
            </div>
            <span class="resident-in-apartment-type ${statusClass}">${statusText}</span>
        </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'resident-in-apartment-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-primary';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Düzenle';
    editBtn.onclick = () => openEditModal(resident);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-danger';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Sil';
    deleteBtn.onclick = () => deleteResidentConfirm(resident);

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(info);
    item.appendChild(actions);

    return item;
}

// Toggle block expand/collapse
function toggleBlockExpand(blockId) {
    const state = blockStates[blockId];
    state.expanded = !state.expanded;

    const content = document.getElementById(`content-${blockId}`);
    const icon = document.getElementById(`toggle-icon-${blockId}`);

    if (state.expanded) {
        content.classList.remove('collapsed');
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('collapsed');
        icon.style.transform = 'rotate(0deg)';
    }
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

// Open add modal for specific block
async function openAddModalForBlock(blockId) {
    // Store block ID and reset form
    document.getElementById('blockIdForApartment').value = blockId;
    document.getElementById('apartmentCount').value = 1;

    document.getElementById('addApartmentModal').style.display = 'flex';
    document.getElementById('apartmentCount').focus();
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

// Delete apartment confirmation
async function deleteApartmentConfirm(blockId, apartmentNo) {
    if (!confirm(`Daire ${apartmentNo}'u ve içindeki tüm sakınları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
        return;
    }

    try {
        await deleteApartment(SITE_ID, blockId, apartmentNo);

        // Decrease block apartment count
        const block = allBlocks.find(b => b.id === blockId);
        if (block && block.apartment_count > 0) {
            const newCapacity = block.apartment_count - 1;
            await updateBlock(SITE_ID, blockId, { apartment_count: newCapacity });
        }

        alert('Daire ve içindeki sakinler başarıyla silindi!');
        renderResidents();
    } catch (err) {
        console.error('Delete apartment failed:', err);
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
            <div style="display: flex; gap: 8px;">
                <button onclick="openEditBlockModal(${block.id}, '${block.block_name}', ${block.apartment_count || 0})" 
                        class="btn btn-sm btn-primary">
                    <i class="fas fa-edit"></i> Düzenle
                </button>
                <button onclick="deleteBlockConfirm(${block.id}, '${block.block_name}')" 
                        class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </div>
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
        await updateBlockDropdowns();
        renderResidents();
    } catch (err) {
        console.error('Delete block failed:', err);
    }
}

// Open edit block modal
async function openEditBlockModal(blockId, blockName, apartmentCount) {
    document.getElementById('editBlockId').value = blockId;
    document.getElementById('editBlockName').value = blockName;
    document.getElementById('editApartmentCount').value = apartmentCount;
    document.getElementById('editBlockModal').style.display = 'flex';
}

// Close edit block modal
function closeEditBlockModal() {
    document.getElementById('editBlockModal').style.display = 'none';
    document.getElementById('editBlockForm').reset();
}

// Open modal to add resident to apartment
function openAddResidentToApartmentModal(blockId, apartmentNo) {
    console.log('📝 Opening add resident modal for block:', blockId, 'apartment:', apartmentNo);

    // Set apartment info
    document.getElementById('addResidentBlockId').value = blockId;
    document.getElementById('addResidentApartmentNo').value = apartmentNo;
    document.getElementById('addResidentName').value = '';
    document.getElementById('addResidentPhone').value = '';
    document.getElementById('addResidentPlate').value = '';
    document.getElementById('addResidentStatus').value = 'OWNER';

    document.getElementById('addResidentModal').style.display = 'flex';
    document.getElementById('addResidentName').focus();
}

// Close add resident modal
function closeAddResidentModal() {
    document.getElementById('addResidentModal').style.display = 'none';
    document.getElementById('addResidentForm').reset();
}

// Auto-increase block capacity if needed
async function autoIncreaseBlockCapacity(blockId, apartmentNo) {
    try {
        const block = allBlocks.find(b => b.id === blockId);
        if (!block) return;

        const apartmentNum = parseInt(apartmentNo);
        const currentCapacity = block.apartment_count || 0;

        // If the apartment number is greater than current capacity, increase capacity
        if (apartmentNum > currentCapacity) {
            console.log(`🔄 Auto-increasing block capacity from ${currentCapacity} to ${apartmentNum}`);

            const updateData = {
                apartment_count: apartmentNum
            };

            await updateBlock(SITE_ID, blockId, updateData);
            console.log(`✅ Block capacity auto-increased to ${apartmentNum}`);
        }
    } catch (err) {
        console.error('Auto-increase capacity error:', err);
    }
}

// Handle add form submit - Add multiple empty apartments
document.getElementById('addApartmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const blockId = parseInt(document.getElementById('blockIdForApartment').value);
    const apartmentCountToAdd = parseInt(document.getElementById('apartmentCount').value);

    if (!blockId || apartmentCountToAdd < 1) {
        alert('Geçersiz blok veya daire sayısı');
        return;
    }

    try {
        const block = allBlocks.find(b => b.id === blockId);
        if (!block) {
            alert('Blok bulunamadı');
            return;
        }

        const currentCapacity = block.apartment_count || 0;
        const newCapacity = currentCapacity + apartmentCountToAdd;

        // Update block capacity
        await updateBlock(SITE_ID, blockId, { apartment_count: newCapacity });

        alert(`${apartmentCountToAdd} daire başarıyla bloka eklendi!`);
        closeAddModal();

        // Ensure the block is expanded when we re-render
        if (blockStates[blockId]) {
            blockStates[blockId].expanded = true;
        }

        console.log('🔄 Re-rendering after adding apartments...');
        renderResidents();
    } catch (err) {
        console.error('Add apartments failed:', err);
        alert('Daire eklenirken hata oluştu: ' + err.message);
    }
});

// Handle add resident form submit
document.getElementById('addResidentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const blockId = parseInt(document.getElementById('addResidentBlockId').value);
    const apartmentNo = document.getElementById('addResidentApartmentNo').value;
    const fullName = document.getElementById('addResidentName').value.trim();
    const phoneNumber = document.getElementById('addResidentPhone').value.trim();
    const plates = document.getElementById('addResidentPlate').value.trim();
    const residentType = document.getElementById('addResidentStatus').value;

    if (!blockId || !apartmentNo || !fullName || !phoneNumber) {
        alert('Zorunlu alanları lütfen doldurunuz');
        return;
    }

    try {
        const residentData = {
            block_id: blockId,
            apartment_no: apartmentNo,
            full_name: fullName,
            phone_number: phoneNumber,
            plates: plates || null,
            resident_type: residentType,
            password: 'defaultPassword123'
        };

        console.log('📝 Creating resident with data:', residentData);

        const resident = await createResident(SITE_ID, residentData);

        console.log('✅ Resident created successfully:', resident);

        alert(`${fullName} başarıyla eklendi!`);
        closeAddResidentModal();

        // Ensure the block is expanded when we re-render
        if (blockStates[blockId]) {
            blockStates[blockId].expanded = true;
        }

        renderResidents();
    } catch (err) {
        console.error('Add resident failed:', err);
    }
});

// Handle edit form submit
document.getElementById('editApartmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const residentId = document.getElementById('editResidentId').value;
    const blockId = parseInt(document.getElementById('editBlock').value);
    const data = {
        block_id: blockId,
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

        // Ensure the block is expanded when we re-render
        if (blockStates[blockId]) {
            blockStates[blockId].expanded = true;
        }

        renderResidents();
    } catch (err) {
        console.error('Update resident failed:', err);
    }
});

// Event listeners
// addResidentBtn removed - now each block has its own "Daire Ekle" button
document.getElementById('closeAddModal').addEventListener('click', closeAddModal);
document.getElementById('closeAddResidentModal').addEventListener('click', closeAddResidentModal);
document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
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
document.getElementById('closeEditBlockModal').addEventListener('click', closeEditBlockModal);

// Handle edit block form submit
document.getElementById('editBlockForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const blockId = parseInt(document.getElementById('editBlockId').value);
    const data = {
        block_name: document.getElementById('editBlockName').value,
        apartment_count: parseInt(document.getElementById('editApartmentCount').value)
    };

    try {
        await updateBlock(SITE_ID, blockId, data);
        alert('Blok başarıyla güncellendi!');
        closeEditBlockModal();

        // Reload everything
        await renderBlocksList();
        await updateBlockDropdowns();
        renderResidents();
    } catch (err) {
        console.error('Update block failed:', err);
    }
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
        await updateBlockDropdowns();
        renderResidents();
    } catch (err) {
        console.error('Create block failed:', err);
    }
});

// Highlight search query in text
function highlightText(text, query) {
    if (!query) return text;

    const query_lower = query.toLowerCase();
    const text_lower = text.toLowerCase();

    if (!text_lower.includes(query_lower)) {
        return text;
    }

    // Find all occurrences and replace with highlighted version
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px; font-weight: bold;">$1</mark>');
}

// Search functionality
function filterResidents(residents) {
    if (!currentSearchQuery) return residents;

    const query = currentSearchQuery.toLowerCase().trim();

    return residents.filter(resident => {
        const fullName = (resident.full_name || '').toLowerCase();
        const phone = (resident.phone_number || '').toLowerCase();
        const plates = (resident.plates || '').toLowerCase();

        return fullName.includes(query) || phone.includes(query) || plates.includes(query);
    });
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    currentSearchQuery = searchInput.value.trim();
    console.log('🔍 Searching for:', currentSearchQuery);
    renderResidents();
}

function clearSearch() {
    currentSearchQuery = '';
    document.getElementById('searchInput').value = '';
    console.log('🔍 Search cleared');
    renderResidents();
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Sayfa başlığını güncelle
    const pageTitle = document.getElementById('page-title');
    if (pageTitle && selectedSite?.site_name) {
        pageTitle.textContent = `Daire Sahipleri - ${selectedSite.site_name}`;
    }

    // Sağ üst köşe admin bilgisi
    const userInfo = document.querySelector('.user-info');
    if (userInfo && currentUser) {
        userInfo.innerHTML = `
            <div class="user-avatar" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #2196F3; color: white; border-radius: 50%; font-weight: bold;">${(currentUser.full_name || 'A')[0].toUpperCase()}</div>
            <div style="margin-left: 10px;">
                <div style="font-weight: 600;">${currentUser.full_name}</div>
                <div style="font-size: 12px; opacity: 0.8;">${currentUser.account_type}</div>
            </div>
        `;
    }

    // Search event listeners
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    if (searchInput) {
        // Real-time search as user types
        searchInput.addEventListener('input', performSearch);
        // Also search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }

    await updateBlockDropdowns();
    renderResidents();
});

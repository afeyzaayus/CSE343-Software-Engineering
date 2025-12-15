// Residents Management
const API_BASE_URL = 'http://localhost:3000/api/residence';
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const SITE_ID = selectedSite?.site_id;
const ITEMS_PER_PAGE = 5;

// Keep track of expanded blocks and shown items
const blockStates = {};

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

        // Group residents by block
        const residentsGroupedByBlock = {};
        blocks.forEach(block => {
            residentsGroupedByBlock[block.id] = [];
        });

        residents.forEach(resident => {
            if (residentsGroupedByBlock[resident.block_id]) {
                residentsGroupedByBlock[resident.block_id].push(resident);
            }
        });

        container.innerHTML = '';

        if (blocks.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">Henüz blok oluşturulmamış</div>';
            return;
        }

        // Create block cards
        blocks.forEach(block => {
            const blockResidents = residentsGroupedByBlock[block.id] || [];
            
            // Initialize block state
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
    const visibleResidents = residents.slice(0, state.itemsShown);
    const hasMoreItems = residents.length > state.itemsShown;

    const header = document.createElement('div');
    header.className = 'block-header';
    header.onclick = () => toggleBlockExpand(block.id);

    header.innerHTML = `
        <div class="block-header-title">
            <i class="fas fa-building"></i>
            <h3>${block.block_name}</h3>
            <span class="block-count">${residents.length} sakin</span>
        </div>
        <i class="fas fa-chevron-down block-toggle-icon" id="toggle-icon-${block.id}"></i>
    `;

    const content = document.createElement('div');
    content.className = `block-content ${state.expanded ? '' : 'collapsed'}`;
    content.id = `content-${block.id}`;

    if (residents.length === 0) {
        content.innerHTML = '<div class="empty-block"><i class="fas fa-info-circle"></i> Bu blokta sakin bulunmamaktadır</div>';
    } else {
        const listDiv = document.createElement('div');
        listDiv.className = 'residents-list';

        visibleResidents.forEach(resident => {
            const residentItem = createResidentItem(resident);
            listDiv.appendChild(residentItem);
        });

        content.appendChild(listDiv);

        // Add "Show More" button if needed
        if (hasMoreItems || state.itemsShown > ITEMS_PER_PAGE) {
            const showMoreDiv = document.createElement('div');
            showMoreDiv.className = 'show-more-btn';

            const button = document.createElement('button');
            if (hasMoreItems) {
                button.innerHTML = `<i class="fas fa-chevron-down"></i> Daha Fazla Göster (${residents.length - state.itemsShown} kalan)`;
                button.onclick = (e) => {
                    e.stopPropagation();
                    expandBlockItems(block.id, residents);
                };
            } else {
                button.innerHTML = `<i class="fas fa-chevron-up"></i> Daha Az Göster`;
                button.onclick = (e) => {
                    e.stopPropagation();
                    collapseBlockItems(block.id);
                };
            }

            showMoreDiv.appendChild(button);
            content.appendChild(showMoreDiv);
        }
    }

    card.appendChild(header);
    card.appendChild(content);

    return card;
}

// Create a resident item element
function createResidentItem(resident) {
    const item = document.createElement('div');
    item.className = 'resident-item';

    const statusText = resident.resident_type === 'OWNER' ? 'Ev Sahibi' : 
                      resident.resident_type === 'HIRER' ? 'Kiracı' : '-';
    const statusClass = resident.resident_type === 'OWNER' ? 'owner' : 'hirer';

    const info = document.createElement('div');
    info.className = 'resident-info';

    info.innerHTML = `
        <div class="resident-name">${resident.apartment_no} No - ${resident.full_name}</div>
        <div class="resident-details">
            <div class="resident-detail-item">
                <i class="fas fa-phone" style="color: #2e86c1;"></i>
                <span>${resident.phone_number || '-'}</span>
            </div>
            <div class="resident-detail-item">
                <i class="fas fa-car" style="color: #2e86c1;"></i>
                <span>${resident.plates || '-'}</span>
            </div>
            <div class="resident-detail-item">
                <i class="fas fa-users" style="color: #2e86c1;"></i>
                <span>${resident.resident_count || 1} kişi</span>
            </div>
            <span class="resident-type ${statusClass}">${statusText}</span>
        </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'resident-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-primary';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Düzenle';
    editBtn.onclick = () => openEditModal(resident);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-danger';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Sil';
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

// Expand to show more items
async function expandBlockItems(blockId, residents) {
    const state = blockStates[blockId];
    state.itemsShown += ITEMS_PER_PAGE;

    const content = document.getElementById(`content-${blockId}`);
    const listDiv = content.querySelector('.residents-list');

    // Get the new items to display
    const visibleResidents = residents.slice(0, state.itemsShown);
    const hasMoreItems = residents.length > state.itemsShown;

    // Clear and rebuild the list
    listDiv.innerHTML = '';
    visibleResidents.forEach(resident => {
        const residentItem = createResidentItem(resident);
        listDiv.appendChild(residentItem);
    });

    // Update the show more button
    const showMoreDiv = content.querySelector('.show-more-btn');
    if (showMoreDiv) {
        showMoreDiv.remove();
    }

    if (hasMoreItems || state.itemsShown > ITEMS_PER_PAGE) {
        const newShowMoreDiv = document.createElement('div');
        newShowMoreDiv.className = 'show-more-btn';

        const button = document.createElement('button');
        if (hasMoreItems) {
            button.innerHTML = `<i class="fas fa-chevron-down"></i> Daha Fazla Göster (${residents.length - state.itemsShown} kalan)`;
            button.onclick = (e) => {
                e.stopPropagation();
                expandBlockItems(blockId, residents);
            };
        } else {
            button.innerHTML = `<i class="fas fa-chevron-up"></i> Daha Az Göster`;
            button.onclick = (e) => {
                e.stopPropagation();
                collapseBlockItems(blockId);
            };
        }

        newShowMoreDiv.appendChild(button);
        content.appendChild(newShowMoreDiv);
    }
}

// Collapse to show fewer items
function collapseBlockItems(blockId) {
    const state = blockStates[blockId];
    state.itemsShown = ITEMS_PER_PAGE;
    renderResidents();
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
    // Sayfa başlığını güncelle
    const pageTitle = document.getElementById('page-title');
    if (pageTitle && selectedSite?.site_name) {
        pageTitle.textContent = `Daire Sahipleri - ${selectedSite.site_name}`;
    }

    await updateBlockDropdowns();
    renderResidents();
});

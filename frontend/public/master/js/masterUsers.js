import { 
    getToken, 
    showNotification, 
    formatDate, 
    showModal, 
    hideModal 
} from './common.js';

const API_BASE = 'http://localhost:5000/api/auth/master';

// Global State
let currentUser = null;
let allUsers = [];
let pendingInvites = [];
let selectedUserId = null;

// ========================================
// 🔧 UTILITY FUNCTIONS
// ========================================

function getRoleName(role) {
    const roleNames = {
        'MASTER_ADMIN': 'Master Admin',
        'DEVELOPER': 'Geliştirici',
        'PRODUCT_OWNER': 'Product Owner',
        'BOOKKEEPER': 'Muhasebe',
        'SUPPORT': 'Destek'
    };
    return roleNames[role] || role;
}

function getRoleBadgeClass(role) {
    const badges = {
        'MASTER_ADMIN': 'badge-danger',
        'DEVELOPER': 'badge-primary',
        'PRODUCT_OWNER': 'badge-success',
        'BOOKKEEPER': 'badge-warning',
        'SUPPORT': 'badge-info'
    };
    return badges[role] || 'badge-secondary';
}

// ========================================
// 📊 DATA FETCHING
// ========================================

async function fetchCurrentUser() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/master/me', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) throw new Error('Kullanıcı bilgisi alınamadı');

        const data = await response.json();
        currentUser = data.data;
        
        // Header'ı güncelle
        document.getElementById('userName').textContent = currentUser.full_name;
        document.getElementById('userEmail').textContent = currentUser.email;
        
        // MASTER_ADMIN ise "Kullanıcı Davet Et" butonunu göster
        if (currentUser.master_role === 'MASTER_ADMIN') {
            document.getElementById('addUserBtn').style.display = 'flex';
            document.getElementById('invitesSection').style.display = 'block';
        }
    } catch (error) {
        console.error('Kullanıcı bilgisi hatası:', error);
        showNotification('Kullanıcı bilgisi alınamadı', 'error');
    }
}

async function fetchUsers() {
    try {
        const response = await fetch(`${API_BASE}/users`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) throw new Error('Kullanıcılar alınamadı');

        const data = await response.json();
        allUsers = data.data.users;
        renderUsers();
    } catch (error) {
        console.error('Kullanıcılar hatası:', error);
        showNotification('Kullanıcılar yüklenemedi', 'error');
    }
}

async function fetchPendingInvites() {
    try {
        const response = await fetch(`${API_BASE}/invites/pending`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) throw new Error('Davetler alınamadı');

        const data = await response.json();
        pendingInvites = data.data || [];
        renderPendingInvites();
    } catch (error) {
        console.error('Davetler hatası:', error);
        showNotification('Davetler yüklenemedi', 'error');
    }
}

// ========================================
// 🎨 RENDERING
// ========================================

function renderUsers() {
    const container = document.getElementById('usersList');
    const roleFilter = document.getElementById('userRoleFilter').value;
    const statusFilter = document.getElementById('userStatusFilter').value;

    // Filtreleme
    let filteredUsers = allUsers;
    
    if (roleFilter !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.master_role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
        if (statusFilter === 'ACTIVE') {
            filteredUsers = filteredUsers.filter(u => u.is_active && u.is_verified);
        } else if (statusFilter === 'PASSIVE') {
            filteredUsers = filteredUsers.filter(u => !u.is_active);
        } else if (statusFilter === 'PENDING') {
            filteredUsers = filteredUsers.filter(u => !u.is_verified);
        }
    }

    if (filteredUsers.length === 0) {
        container.innerHTML = '<div class="no-data">Kullanıcı bulunamadı</div>';
        return;
    }

    container.innerHTML = filteredUsers.map(user => `
        <div class="user-card">
            <div class="user-card-header">
                <div class="user-avatar">
                    ${user.full_name.charAt(0).toUpperCase()}
                </div>
                <div class="user-basic-info">
                    <h3>${user.full_name}</h3>
                    <p class="user-email">${user.email}</p>
                </div>
                <div class="user-badges">
                    <span class="badge ${getRoleBadgeClass(user.master_role)}">
                        ${getRoleName(user.master_role)}
                    </span>
                    ${user.deleted_at 
                        ? '<span class="badge badge-dark">Silinmiş</span>'
                        : user.is_active && user.is_verified 
                            ? '<span class="badge badge-success">Aktif</span>'
                            : !user.is_verified
                            ? '<span class="badge badge-warning">Beklemede</span>'
                            : '<span class="badge badge-secondary">Pasif</span>'
                    }
                </div>
            </div>
            <div class="user-card-body">
                <div class="user-info-grid">
                    <div class="info-item">
                        <span class="info-label">Son Giriş:</span>
                        <span class="info-value">${formatDate(user.last_login_at)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Kayıt Tarihi:</span>
                        <span class="info-value">${formatDate(user.created_at)}</span>
                    </div>
                </div>
            </div>
            ${currentUser?.master_role === 'MASTER_ADMIN' && currentUser.id !== user.id ? `
                <div class="user-card-footer">
                    <button class="btn btn-sm btn-primary" onclick="window.openUserActions(${user.id})">
                        İşlemler
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function renderPendingInvites() {
    const container = document.getElementById('pendingInvitesList');

    if (pendingInvites.length === 0) {
        container.innerHTML = '<div class="no-data">Bekleyen davet bulunmuyor</div>';
        return;
    }

    container.innerHTML = pendingInvites.map(invite => `
        <div class="invite-card">
            <div class="invite-info">
                <h4>${invite.full_name}</h4>
                <p>${invite.email}</p>
                <span class="badge ${getRoleBadgeClass(invite.master_role)}">
                    ${getRoleName(invite.master_role)}
                </span>
            </div>
            <div class="invite-meta">
                <small>Gönderilme: ${formatDate(invite.created_at)}</small>
                <small>Son Geçerlilik: ${formatDate(invite.tokenExpiry)}</small>
            </div>
        </div>
    `).join('');
}

// ========================================
// 🔐 USER ACTIONS (MASTER_ADMIN Only)
// ========================================

async function inviteUser(email, fullName, role) {
    try {
        const response = await fetch(`${API_BASE}/invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                email,
                full_name: fullName,
                role
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Davet gönderilemedi');
        }

        showNotification('Davet başarıyla gönderildi', 'success');
        hideModal('inviteUserModal');
        document.getElementById('inviteUserForm').reset();
        
        // Listeyi yenile
        await fetchPendingInvites();
    } catch (error) {
        console.error('Davet hatası:', error);
        showNotification(error.message, 'error');
    }
}

window.openUserActions = function(userId) {
    selectedUserId = userId;
    const user = allUsers.find(u => u.id === userId);

    if (!user) return;

    // Kullanıcı bilgisini göster
    document.getElementById('selectedUserInfo').innerHTML = `
        <h3>${user.full_name}</h3>
        <p>${user.email}</p>
        <span class="badge ${getRoleBadgeClass(user.master_role)}">
            ${getRoleName(user.master_role)}
        </span>
    `;

    // Aktif/Pasif butonlarını göster/gizle
    if (user.is_active && !user.deleted_at) {
        document.getElementById('deactivateUserBtn').style.display = 'block';
        document.getElementById('activateUserBtn').style.display = 'none';
        document.getElementById('restoreUserBtn').style.display = 'none';
        document.getElementById('hardDeleteUserBtn').style.display = 'none';
    } else if (!user.is_active && !user.deleted_at) {
        document.getElementById('deactivateUserBtn').style.display = 'none';
        document.getElementById('activateUserBtn').style.display = 'block';
        document.getElementById('restoreUserBtn').style.display = 'none';
        document.getElementById('hardDeleteUserBtn').style.display = 'none';
    } else if (user.deleted_at) {
        // Silinmiş kullanıcı için sadece geri yükle ve hard delete göster
        document.getElementById('deactivateUserBtn').style.display = 'none';
        document.getElementById('activateUserBtn').style.display = 'none';
        document.getElementById('restoreUserBtn').style.display = 'block';
        document.getElementById('hardDeleteUserBtn').style.display = 'block';
    }

    // Mevcut rolü select'te seç
    document.getElementById('newRole').value = user.master_role;

    showModal('userActionsModal');
};

async function changeUserRole(userId, newRole) {
    try {
        const response = await fetch(`${API_BASE}/users/role`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                targetUserId: userId,
                newRole
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Rol değiştirilemedi');
        }

        showNotification('Kullanıcı rolü başarıyla değiştirildi', 'success');
        hideModal('userActionsModal');
        
        // Listeyi yenile
        await fetchUsers();
    } catch (error) {
        console.error('Rol değiştirme hatası:', error);
        showNotification(error.message, 'error');
    }
}

async function deactivateUser(userId) {
    if (!confirm('Bu kullanıcıyı pasif etmek istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`${API_BASE}/users/deactivate`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ targetUserId: userId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Kullanıcı pasif edilemedi');
        }

        showNotification('Kullanıcı başarıyla pasif edildi', 'success');
        hideModal('userActionsModal');
        
        await fetchUsers();
    } catch (error) {
        console.error('Pasif etme hatası:', error);
        showNotification(error.message, 'error');
    }
}

async function reactivateUser(userId) {
    try {
        const response = await fetch(`${API_BASE}/users/reactivate`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ targetUserId: userId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Kullanıcı aktif edilemedi');
        }

        showNotification('Kullanıcı başarıyla aktif edildi', 'success');
        hideModal('userActionsModal');
        
        await fetchUsers();
    } catch (error) {
        console.error('Aktif etme hatası:', error);
        showNotification(error.message, 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;

    try {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ targetUserId: userId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Kullanıcı silinemedi');
        }

        showNotification('Kullanıcı başarıyla silindi', 'success');
        hideModal('userActionsModal');
        
        await fetchUsers();
    } catch (error) {
        console.error('Silme hatası:', error);
        showNotification(error.message, 'error');
    }
}

async function restoreUser(userId) {
    if (!confirm('Bu kullanıcıyı geri yüklemek istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`${API_BASE}/users/restore`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ targetUserId: userId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Kullanıcı geri yüklenemedi');
        }

        showNotification('Kullanıcı başarıyla geri yüklendi', 'success');
        hideModal('userActionsModal');
        await fetchUsers();
    } catch (error) {
        console.error('Geri yükleme hatası:', error);
        showNotification(error.message, 'error');
    }
}

async function hardDeleteUser(userId) {
    if (!confirm('Bu kullanıcıyı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;

    try {
        const response = await fetch(`${API_BASE}/users/hard`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ targetUserId: userId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Kullanıcı tamamen silinemedi');
        }

        showNotification('Kullanıcı kalıcı olarak silindi', 'success');
        hideModal('userActionsModal');
        await fetchUsers();
    } catch (error) {
        console.error('Hard delete hatası:', error);
        showNotification(error.message, 'error');
    }
}

// ========================================
// 📝 EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    // Token kontrolü
    if (!getToken()) {
        window.location.href = 'login.html';
        return;
    }

    // İlk yükleme
    await fetchCurrentUser();
    await fetchUsers();
    await fetchPendingInvites();

    // Çıkış butonu
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('masterToken');
        window.location.href = 'login.html';
    });

    // Kullanıcı davet et butonu
    document.getElementById('addUserBtn')?.addEventListener('click', () => {
        showModal('inviteUserModal');
    });

    // Modal kapatma
    document.getElementById('closeInviteModal')?.addEventListener('click', () => {
        hideModal('inviteUserModal');
    });

    document.getElementById('closeActionsModal')?.addEventListener('click', () => {
        hideModal('userActionsModal');
        document.getElementById('changeRoleForm').style.display = 'none';
    });

    document.getElementById('cancelInvite')?.addEventListener('click', () => {
        hideModal('inviteUserModal');
    });

    // Davet formu submit
    document.getElementById('inviteUserForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('inviteEmail').value;
        const fullName = document.getElementById('inviteName').value;
        const role = document.getElementById('inviteRole').value;

        if (!email || !fullName || !role) {
            showNotification('Lütfen tüm alanları doldurun', 'error');
            return;
        }

        await inviteUser(email, fullName, role);
    });

    // Rol değiştirme butonu
    document.getElementById('changeRoleBtn')?.addEventListener('click', () => {
        const form = document.getElementById('changeRoleForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    // Rol değiştirme onaylama
    document.getElementById('confirmRoleChange')?.addEventListener('click', async () => {
        const newRole = document.getElementById('newRole').value;
        await changeUserRole(selectedUserId, newRole);
    });

    // Aktif/Pasif etme butonları
    document.getElementById('activateUserBtn')?.addEventListener('click', async () => {
        await reactivateUser(selectedUserId);
    });

    document.getElementById('deactivateUserBtn')?.addEventListener('click', async () => {
        await deactivateUser(selectedUserId);
    });

    // Kullanıcı silme butonu
    document.getElementById('deleteUserBtn')?.addEventListener('click', async () => {
        await deleteUser(selectedUserId);
    });

    document.getElementById('restoreUserBtn')?.addEventListener('click', async () => {
        await restoreUser(selectedUserId);
    });

    document.getElementById('hardDeleteUserBtn')?.addEventListener('click', async () => {
        await hardDeleteUser(selectedUserId);
    });

    // Filtreler
    document.getElementById('userRoleFilter')?.addEventListener('change', renderUsers);
    document.getElementById('userStatusFilter')?.addEventListener('change', renderUsers);

    // Modal dışına tıklayınca kapatma
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
});
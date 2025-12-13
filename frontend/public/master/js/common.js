// ========================================
// 🔐 TOKEN YÖNETİMİ
// ========================================

export function getToken() {
    return localStorage.getItem('masterToken');
}

export function setToken(token) {
    localStorage.setItem('masterToken', token);
}

export function removeToken() {
    localStorage.removeItem('masterToken');
}

export function getUserData() {
    const userData = localStorage.getItem('masterUserData');
    return userData ? JSON.parse(userData) : null;
}

export function setUserData(data) {
    localStorage.setItem('masterUserData', JSON.stringify(data));
}

// ========================================
// 📅 TARİH FORMATLAMA
// ========================================

export function formatDate(dateString) {
    if (!dateString) return 'Hiçbir zaman';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatDateShort(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

// ========================================
// 💰 PARA FORMATI
// ========================================

export function formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
    }).format(amount);
}

// ========================================
// 🎨 DURUM BADGE'İ
// ========================================

export function createStatusBadge(status) {
    const statusMap = {
        'ACTIVE': { text: 'Aktif', class: 'status-active' },
        'PASSIVE': { text: 'Pasif', class: 'status-passive' },
        'SUSPENDED': { text: 'Askıda', class: 'status-suspended' },
        'DELETED': { text: 'Silinmiş', class: 'status-deleted' },
        'PENDING': { text: 'Beklemede', class: 'status-pending' },
    };

    const statusInfo = statusMap[status] || { text: status, class: 'status-default' };
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

// ========================================
// 🔔 BİLDİRİMLER
// ========================================

export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': '✓',
        'error': '✕',
        'warning': '⚠',
        'info': 'ℹ'
    };
    return icons[type] || 'ℹ';
}

export function showToast(message, type = 'info') {
    showNotification(message, type);
}

// ========================================
// 🪟 MODAL YÖNETİMİ
// ========================================

export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

export function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Modal dışına tıklayınca kapat
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// ========================================
// ⏳ LOADING
// ========================================

export function showLoading(element) {
    if (!element) return;
    element.innerHTML = '<div class="spinner"></div>';
}

export function hideLoading(element) {
    if (!element) return;
    const spinner = element.querySelector('.spinner');
    if (spinner) spinner.remove();
}

export function setLoading(buttonElement, isLoading) {
    if (!buttonElement) return;
    
    if (isLoading) {
        buttonElement.disabled = true;
        buttonElement.dataset.originalText = buttonElement.textContent;
        buttonElement.innerHTML = '<span class="spinner-small"></span> Yükleniyor...';
    } else {
        buttonElement.disabled = false;
        buttonElement.textContent = buttonElement.dataset.originalText || 'Gönder';
    }
}

// ========================================
// 🚪 LOGOUT
// ========================================

export function logout() {
    removeToken();
    localStorage.removeItem('masterUserData');
    window.location.href = 'login.html';
}

// ========================================
// 📋 HEADER BİLGİLERİ
// ========================================

export function updateHeaderInfo() {
    const userData = getUserData();
    if (userData) {
        const userNameEl = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        const userRoleEl = document.getElementById('userRole');
        
        if (userNameEl) userNameEl.textContent = userData.full_name || userData.email;
        if (userEmailEl) userEmailEl.textContent = userData.email;
        if (userRoleEl) userRoleEl.textContent = getRoleName(userData.master_role);
    }
}

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

// ========================================
// 🔍 ARAMA
// ========================================

export function initGlobalSearch(callback) {
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.trim();
            if (query.length > 2 && callback) {
                await callback(query);
            }
        }, 300));
    }
}

// ========================================
// 🛠️ UTILITY FUNCTIONS
// ========================================

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

export function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Panoya kopyalandı', 'success');
    }).catch(() => {
        showNotification('Kopyalama başarısız', 'error');
    });
}

// ========================================
// 🔄 LOGOUT BUTONUNU DİNLE
// ========================================

export function initLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
                logout();
            }
        });
    }
}

// ========================================
// 🚀 SAYFA YÜKLENDİĞİNDE ORTAK FONKSİYONLARI BAŞLAT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Token kontrolü
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['login.html', 'verify-email.html', 'set-password.html'];
    
    if (!publicPages.includes(currentPage) && !getToken()) {
        window.location.href = 'login.html';
        return;
    }

    updateHeaderInfo();
    initLogoutButton();
});
const BASE_URL = 'http://localhost:3000';

let currentUser = null;
let currentToken = null;
let userSites = [];

// Sayfa yüklendiğinde auth kontrolü
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    const siteIdInput = document.getElementById('site-id');
    if (siteIdInput) siteIdInput.value = generateSiteId();
});

// Auth kontrolü
function checkAuth() {
    currentToken = localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('currentUser');
    
    if (!currentToken || !userDataString) {
        // Giriş yapılmamışsa login sayfasına yönlendir
        window.location.href = 'login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(userDataString);
        showAdminDashboard();
    } catch (error) {
        console.error('Kullanıcı verileri okunamadı:', error);
        window.location.href = 'login.html';
    }
}

// Alert göster/gizle
function showAlert(elementId, message, isError = false) {
    const alert = document.getElementById(elementId);
    alert.textContent = message;
    alert.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
    alert.classList.remove('hidden');
    setTimeout(() => alert.classList.add('hidden'), 5000);
}

function hideAlert(elementId) {
    const alert = document.getElementById(elementId);
    alert.classList.add('hidden');
}

// API Request
async function apiRequest(endpoint, data = {}, requiresAuth = false, method = 'POST') {
    const headers = { 'Content-Type': 'application/json' };
    if (requiresAuth && currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    try {
        const response = await fetch(`${BASE_URL}/api/auth${endpoint}`, {
            method,
            headers,
            body: method === 'GET' ? undefined : JSON.stringify(data)
        });
        const result = await response.json();
        return { ok: response.ok, data: result };
    } catch (error) {
        console.error('API Hatası:', error);
        return { ok: false, data: { message: 'Bağlantı hatası' } };
    }
}

// DASHBOARD
function showAdminDashboard() {
    if (!currentUser) return;
    document.getElementById('admin-name').textContent = currentUser.full_name || 'Admin';
    document.getElementById('admin-type').textContent = currentUser.account_type || 'INDIVIDUAL';
    document.getElementById('admin-avatar').textContent = (currentUser.full_name || 'A')[0].toUpperCase();
    document.getElementById('site-limit').textContent = currentUser.account_type === 'COMPANY' ? 5 : 1;
    loadSites();
}

// SITE MANAGEMENT
async function loadSites() {
    const response = await apiRequest('/site/admin-sites', {}, true, 'GET');
    userSites = response.ok && Array.isArray(response.data.sites) ? response.data.sites : [];
    updateSitesList();
}

function updateSitesList() {
    const sitesList = document.getElementById('sites-list');
    document.getElementById('total-sites').textContent = userSites.length;
    if (!userSites.length) {
        sitesList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <h3>Henüz Site Yok</h3>
                <p>Aşağıdaki formu kullanarak ilk sitenizi oluşturun.</p>
            </div>
        `;
    } else {
        sitesList.innerHTML = userSites.map(site => `
            <div class="site-card">
                <h3>${site.site_name}</h3>
                <p><strong>Site ID:</strong> ${site.site_id}</p>
                <p><strong>Adres:</strong> ${site.site_address}</p>
                <span class="badge">Aktif</span>
                <div class="site-actions">
                    <button class="btn-small btn-select" onclick="selectSite('${site.site_id}')">Siteyi Seç</button>
                </div>
            </div>
        `).join('');
    }
}

function generateSiteId(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Site oluşturma formu
document.getElementById('create-site-form').addEventListener('submit', async e => {
    e.preventDefault();
    const siteIdInput = document.getElementById('site-id');
    const data = {
        site_id: siteIdInput.value,
        site_name: document.getElementById('site-name').value,
        site_address: document.getElementById('site-address').value
    };
    const response = await apiRequest('/site/create', data, true);
    if (response.ok) {
        showAlert('create-site-alert', 'Site başarıyla oluşturuldu!', false);
        userSites.push(data);
        updateSitesList();
        e.target.reset();
        siteIdInput.value = generateSiteId();
    } else {
        showAlert('create-site-alert', response.data.message || 'Site oluşturulamadı', true);
    }
});

// Site seçme fonksiyonu
function selectSite(siteId) {
    const selectedSite = userSites.find(s => s.site_id === siteId);
    if (selectedSite) {
        // LocalStorage'a kaydet
        localStorage.setItem('selectedSite', JSON.stringify(selectedSite));
        
        // Dashboard sayfasına yönlendir
        window.location.href = 'dashboard.html';
    }
}

// Çıkış fonksiyonu
function logout() {
    // LocalStorage'ı temizle
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('selectedSite');
    
    // Değişkenleri sıfırla
    currentUser = null;
    currentToken = null;
    userSites = [];
    
    // Login sayfasına yönlendir
    window.location.href = 'login.html';
}
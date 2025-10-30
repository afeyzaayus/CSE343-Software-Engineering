const BASE_URL = 'http://localhost:3000/api/auth';

let currentUser = null;
let currentToken = null;
let userSites = [];

const pages = {
    auth: document.getElementById('auth-container'),
    adminDashboard: document.getElementById('admin-dashboard')
};

// Auth Sayfası geçişleri
function showLogin() {
    document.getElementById('auth-pages').classList.remove('slide-left');
    document.getElementById('auth-pages').classList.add('slide-right');
    updateAllAuthButtons(true);
    document.getElementById('register-form').reset();
    hideAlert('register-alert');
}

function showRegister() {
    document.getElementById('auth-pages').classList.remove('slide-right');
    document.getElementById('auth-pages').classList.add('slide-left');
    updateAllAuthButtons(false);
    document.getElementById('login-form').reset();
    hideAlert('login-alert');
}

function updateAllAuthButtons(isLoginActive) {
    document.querySelectorAll('.auth-switch').forEach(switchContainer => {
        const buttons = switchContainer.querySelectorAll('.auth-switch-btn');
        buttons.forEach((btn, index) => btn.classList.toggle('active', isLoginActive ? index === 0 : index === 1));
    });
}

function showPage(pageToShow) {
    Object.values(pages).forEach(page => page.classList.add('hidden'));
    if (pageToShow) pageToShow.classList.remove('hidden');
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
        const response = await fetch(`${BASE_URL}${endpoint}`, {
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

// Login/Register alan toggle
function toggleLoginFields() {
    document.getElementById('admin-login-fields').classList.remove('hidden');
}

function toggleRegisterFields() {
    const adminFields = document.getElementById('admin-register-fields');
    adminFields.classList.remove('hidden');

    // Admin alanlarının required durumunu güncelle
    adminFields.querySelectorAll('input, select').forEach(el => {
        el.required = true;
    });
}

// Sayfa yüklendiğinde admin alanlarını göster
document.addEventListener('DOMContentLoaded', () => {
    toggleLoginFields();
    toggleRegisterFields();
    showLogin();
});

// Company name field toggle
document.getElementById('register-account-type')?.addEventListener('change', e => {
    const companyNameGroup = document.getElementById('company-name-group');
    if (companyNameGroup) {
        companyNameGroup.style.display = e.target.value === 'COMPANY' ? 'block' : 'none';
    }
});

// LOGIN (Sadece admin)
document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    };

    const response = await apiRequest('/admin/login', data);

    if (response.ok) {
        currentToken = response.data.token;
        currentUser = response.data.admin;
        showPage(pages.adminDashboard);
        showAdminDashboard();
    } else {
        showAlert('login-alert', response.data.message || 'Giriş başarısız', true);
    }
});

// REGISTER (Sadece admin)
document.getElementById('register-form').addEventListener('submit', async e => {
    e.preventDefault();

    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    if (password !== passwordConfirm) {
        showAlert('register-alert', 'Şifreler eşleşmiyor!', true);
        return;
    }

    const data = {
        full_name: document.getElementById('register-fullname').value,
        email: document.querySelector('#admin-register-fields input[type="email"]').value,
        password,
        account_type: document.getElementById('register-account-type').value,
        company_name:
            document.getElementById('register-account-type').value === 'COMPANY'
                ? document.getElementById('register-company').value
                : undefined
    };

    const response = await apiRequest('/admin/register', data);

    if (response.ok) {
        showAlert('register-alert', 'Kayıt başarılı! E-postanızı doğrulayın.', false);
        setTimeout(showLogin, 2000);
    } else {
        showAlert('register-alert', response.data.message || 'Kayıt başarısız', true);
    }
});

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
        sitesList.innerHTML = `<div class="empty-state"><h3>Henüz Site Yok</h3><p>Aşağıdaki formu kullanarak ilk sitenizi oluşturun.</p></div>`;
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

document.addEventListener('DOMContentLoaded', () => {
    const siteIdInput = document.getElementById('site-id');
    if (siteIdInput) siteIdInput.value = generateSiteId();
    showLogin();
});

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

function selectSite(siteId) {
    const selectedSite = userSites.find(s => s.site_id === siteId);
    if (selectedSite) {
        const title = document.getElementById('admin-welcome-title');
        if (title) {
            title.textContent = `${selectedSite.site_name} - Yönetim Paneli`;
        }
    }
}


function logout() {
    currentUser = null;
    currentToken = null;
    userSites = [];
    showPage(pages.auth);
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    showLogin();
}

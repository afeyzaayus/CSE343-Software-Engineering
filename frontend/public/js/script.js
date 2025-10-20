const BASE_URL = 'http://localhost:3000/api/auth';

let currentUser = null;
let currentToken = null;
let userSites = [];

const pages = {
    login: document.getElementById('login-page'),
    register: document.getElementById('register-page'),
    userDashboard: document.getElementById('user-dashboard'),
    adminDashboard: document.getElementById('admin-dashboard')
};

function showPage(pageToShow) {
    Object.values(pages).forEach(page => page.classList.add('hidden'));
    pageToShow.classList.remove('hidden');
}

document.getElementById('show-register').addEventListener('click', e => { e.preventDefault(); showPage(pages.register); });
document.getElementById('show-login').addEventListener('click', e => { e.preventDefault(); showPage(pages.login); });

function showAlert(elementId, message, isError = false) {
    const alert = document.getElementById(elementId);
    alert.textContent = message;
    alert.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
    alert.classList.remove('hidden');
    setTimeout(() => alert.classList.add('hidden'), 5000);
}

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

// Login/Register Fields
function toggleLoginFields(isAdmin) {
    document.getElementById('user-login-fields').classList.toggle('hidden', isAdmin);
    document.getElementById('admin-login-fields').classList.toggle('hidden', !isAdmin);
}

function toggleRegisterFields(isAdmin) {
    document.getElementById('user-register-fields').classList.toggle('hidden', isAdmin);
    document.getElementById('admin-register-fields').classList.toggle('hidden', !isAdmin);
}

document.getElementById('login-type').addEventListener('change', e => toggleLoginFields(e.target.value === 'admin'));
document.getElementById('register-type').addEventListener('change', e => toggleRegisterFields(e.target.value === 'admin'));
document.getElementById('register-account-type').addEventListener('change', e => {
    document.getElementById('company-name-group').style.display = e.target.value === 'COMPANY' ? 'block' : 'none';
});

// LOGIN
document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const loginType = document.getElementById('login-type').value;
    const data = loginType === 'admin'
        ? { email: document.getElementById('login-email').value, password: document.getElementById('login-password').value }
        : { phone_number: document.getElementById('login-phone').value, password: document.getElementById('login-password').value };
    const endpoint = loginType === 'admin' ? '/admin/login' : '/user/login';
    const response = await apiRequest(endpoint, data);

    if (response.ok) {
        currentToken = response.data.token;
        currentUser = response.data.admin || response.data.user;
        showPage(loginType === 'admin' ? pages.adminDashboard : pages.userDashboard);
        loginType === 'admin' ? showAdminDashboard() : showUserDashboard();
    } else {
        showAlert('login-alert', response.data.message || 'Giriş başarısız', true);
    }
});

// REGISTER
document.getElementById('register-form').addEventListener('submit', async e => {
    e.preventDefault();
    const registerType = document.getElementById('register-type').value;
    let data = {};
    if (registerType === 'admin') {
        const accountType = document.getElementById('register-account-type').value;
        data = {
            full_name: document.getElementById('register-fullname').value,
            email: document.getElementById('register-email').value,
            password: document.getElementById('register-password').value,
            account_type: accountType,
            company_name: accountType === 'COMPANY' ? document.getElementById('register-company').value : undefined
        };
    } else {
        data = {
            full_name: document.getElementById('register-fullname').value,
            email: document.getElementById('register-email').value,
            phone_number: document.getElementById('register-phone').value,
            password: document.getElementById('register-password').value,
            site_id: document.getElementById('register-siteid').value,
            block_no: document.getElementById('register-block').value,
            apartment_no: document.getElementById('register-apartment').value
        };
    }
    const endpoint = registerType === 'admin' ? '/admin/register' : '/user/register';
    const response = await apiRequest(endpoint, data);

    if (response.ok) {
        showAlert('register-alert', 'Kayıt başarılı! Giriş yapabilirsiniz.', false);
        setTimeout(() => showPage(pages.login), 2000);
    } else {
        showAlert('register-alert', response.data.message || 'Kayıt başarısız', true);
    }
});

// DASHBOARD
function showUserDashboard() {
    document.getElementById('user-name').textContent = currentUser.full_name || 'Kullanıcı';
    document.getElementById('user-role').textContent = 'Site Kullanıcısı';
    document.getElementById('user-avatar').textContent = (currentUser.full_name || 'U').charAt(0).toUpperCase();
    document.getElementById('welcome-title').textContent = `Hoş Geldiniz, ${currentUser.full_name}!`;
}

function showAdminDashboard() {
    document.getElementById('admin-name').textContent = currentUser.full_name || 'Admin';
    document.getElementById('admin-type').textContent = currentUser.account_type || 'INDIVIDUAL';
    document.getElementById('admin-avatar').textContent = (currentUser.full_name || 'A').charAt(0).toUpperCase();
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
    if (userSites.length === 0) {
        sitesList.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg><h3>Henüz Site Yok</h3><p>Aşağıdaki formu kullanarak ilk sitenizi oluşturun.</p></div>`;
    } else {
        sitesList.innerHTML = userSites.map(site => `<div class="site-card"><h3>${site.site_name}</h3><p><strong>Site ID:</strong> ${site.site_id}</p><p><strong>Adres:</strong> ${site.site_address}</p><span class="badge">Aktif</span><div class="site-actions"><button class="btn-small btn-select" onclick="selectSite('${site.site_id}')">Siteyi Seç</button></div></div>`).join('');
    }
}

function generateSiteId(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const siteIdInput = document.getElementById('site-id');
    if (siteIdInput) siteIdInput.value = generateSiteId();
});

document.getElementById('create-site-form').addEventListener('submit', async e => {
    e.preventDefault();
    const siteIdInput = document.getElementById('site-id');
    const data = {
        site_id: siteIdInput.value,
        site_name: document.getElementById('site-name').value,
        site_address: document.getElementById('site-address').value,
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
    showPage(pages.userDashboard);
    const selectedSite = userSites.find(s => s.site_id === siteId);
    if (selectedSite) {
        document.getElementById('welcome-title').textContent = `${selectedSite.site_name} - Yönetim Paneli`;
    }
}

function logout() {
    currentUser = null;
    currentToken = null;
    userSites = [];
    showPage(pages.login);
    document.getElementById('login-form').reset();
}

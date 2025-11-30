// Tab Navigation
document.querySelectorAll('.nav-item:not(.logout)').forEach(item => {
    item.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        
        // Remove active class from all nav items and tabs
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        
        // Add active class to clicked nav item and corresponding tab
        this.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// Logout
document.querySelector('.nav-item.logout').addEventListener('click', function() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        alert('Güvenli çıkış yapıldı!');
        // window.location.href = '/login';
    }
});

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal buttons
document.querySelectorAll('.close-btn, .close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
    });
});

// Close modal on outside click
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
});

// Search functionality
document.querySelectorAll('.search-box').forEach(input => {
    input.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const table = this.closest('.filters').nextElementSibling;
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
});

// Sample Data (Replace with API calls)
const sampleCompanies = [
    { id: 1, company_name: 'ABC Yapı', company_code: 'ABC001', account_status: 'ACTIVE', created_at: '2024-01-15' },
    { id: 2, company_name: 'XYZ Site Yönetim', company_code: 'XYZ002', account_status: 'ACTIVE', created_at: '2024-02-20' }
];

const sampleAdmins = [
    { id: 1, full_name: 'Ahmet Yılmaz', email: 'ahmet@abc.com', account_type: 'COMPANY_MANAGER', company_name: 'ABC Yapı', account_status: 'ACTIVE' },
    { id: 2, full_name: 'Ayşe Demir', email: 'ayse@xyz.com', account_type: 'INDIVIDUAL', company_name: null, account_status: 'ACTIVE' }
];

const sampleSites = [
    { id: 1, site_name: 'Modern Life Rezidans', site_address: 'İstanbul, Kadıköy', company_name: 'ABC Yapı', block_count: 4, apartment_count: 120, site_status: 'ACTIVE' }
];

const sampleUsers = [
    { id: 1, full_name: 'Mehmet Kaya', phone_number: '05321234567', site_name: 'Modern Life Rezidans', block_name: 'A Blok', apartment_no: '12', account_status: 'ACTIVE' }
];

const sampleMasterUsers = [
    { id: 1, full_name: 'Master Admin', email: 'admin@system.com', master_role: 'MASTER_ADMIN', is_active: true, last_login_at: '2025-11-30' }
];

// Load Data Functions
function loadCompanies() {
    const tbody = document.getElementById('companiesTable');
    tbody.innerHTML = sampleCompanies.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.company_name}</td>
            <td>${c.company_code}</td>
            <td><span class="badge badge-${c.account_status.toLowerCase()}">${c.account_status}</span></td>
            <td>${c.created_at}</td>
            <td>
                <div class="actions">
                    <button class="icon-btn view" title="Görüntüle">👁️</button>
                    <button class="icon-btn edit" title="Düzenle">✏️</button>
                    <button class="icon-btn delete" title="Sil">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function loadAdmins() {
    const tbody = document.getElementById('adminsTable');
    tbody.innerHTML = sampleAdmins.map(a => `
        <tr>
            <td>${a.id}</td>
            <td>${a.full_name}</td>
            <td>${a.email}</td>
            <td>${a.account_type}</td>
            <td>${a.company_name || '-'}</td>
            <td><span class="badge badge-${a.account_status.toLowerCase()}">${a.account_status}</span></td>
            <td>
                <div class="actions">
                    <button class="icon-btn view" title="Görüntüle">👁️</button>
                    <button class="icon-btn edit" title="Düzenle">✏️</button>
                    <button class="icon-btn delete" title="Sil">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function loadSites() {
    const tbody = document.getElementById('sitesTable');
    tbody.innerHTML = sampleSites.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${s.site_name}</td>
            <td>${s.site_address}</td>
            <td>${s.company_name || '-'}</td>
            <td>${s.block_count}</td>
            <td>${s.apartment_count}</td>
            <td><span class="badge badge-${s.site_status.toLowerCase()}">${s.site_status}</span></td>
            <td>
                <div class="actions">
                    <button class="icon-btn view" title="Görüntüle">👁️</button>
                    <button class="icon-btn edit" title="Düzenle">✏️</button>
                    <button class="icon-btn delete" title="Sil">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function loadUsers() {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = sampleUsers.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.full_name}</td>
            <td>${u.phone_number}</td>
            <td>${u.site_name}</td>
            <td>${u.block_name}</td>
            <td>${u.apartment_no}</td>
            <td><span class="badge badge-${u.account_status.toLowerCase()}">${u.account_status}</span></td>
            <td>
                <div class="actions">
                    <button class="icon-btn view" title="Görüntüle">👁️</button>
                    <button class="icon-btn edit" title="Düzenle">✏️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function loadMasterUsers() {
    const tbody = document.getElementById('masterUsersTable');
    tbody.innerHTML = sampleMasterUsers.map(m => `
        <tr>
            <td>${m.id}</td>
            <td>${m.full_name}</td>
            <td>${m.email}</td>
            <td>${m.master_role}</td>
            <td><span class="badge badge-${m.is_active ? 'active' : 'suspended'}">${m.is_active ? 'Aktif' : 'Pasif'}</span></td>
            <td>${m.last_login_at || '-'}</td>
            <td>
                <div class="actions">
                    <button class="icon-btn view" title="Görüntüle">👁️</button>
                    <button class="icon-btn edit" title="Düzenle">✏️</button>
                    <button class="icon-btn delete" title="Sil">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Form Submit Handlers (Replace with API calls)
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Form gönderildi! (API entegrasyonu gerekli)');
        this.closest('.modal').classList.remove('active');
        this.reset();
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadCompanies();
    loadAdmins();
    loadSites();
    loadUsers();
    loadMasterUsers();
    
    // Update stats
    document.querySelectorAll('.stat-card .value')[0].textContent = sampleCompanies.length;
    document.querySelectorAll('.stat-card .value')[1].textContent = sampleAdmins.length;
    document.querySelectorAll('.stat-card .value')[2].textContent = sampleSites.length;
    document.querySelectorAll('.stat-card .value')[3].textContent = sampleUsers.length;
});
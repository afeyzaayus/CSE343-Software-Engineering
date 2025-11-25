import { getAuthToken } from './auth.js';

const API_BASE = '/api/sites';

async function fetchUserRequests(userId) {
    try {
        const res = await fetch(`/api/users/${userId}/requests`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Talepler alınamadı');
        return await res.json();
    } catch (err) { console.error(err); return []; }
}

async function fetchSiteRequests(siteId) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/requests`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Site talepleri alınamadı');
        return await res.json();
    } catch (err) { console.error(err); return []; }
}

function displayRequests(requests) {
    const pendingList = document.getElementById('pending-requests-list');
    const inProgressList = document.getElementById('inprogress-requests-list');
    const resolvedList = document.getElementById('resolved-requests-list');

    pendingList.innerHTML = '';
    inProgressList.innerHTML = '';
    resolvedList.innerHTML = '';

    requests.forEach(r => {
        const div = document.createElement('div');
        div.classList.add('complaint-item');
        div.innerHTML = `<h3>${r.title}</h3><p>${r.description}</p><p>Durum: ${r.status}</p>`;

        const status = r.status.toLowerCase();
        if (status === 'bekleyen') pendingList.appendChild(div);
        else if (status === 'işlemde') inProgressList.appendChild(div);
        else if (status === 'çözülen') resolvedList.appendChild(div);
    });

    if (!pendingList.hasChildNodes()) pendingList.innerHTML = '<p style="text-align:center; color:#7f8c8d;">Bekleyen talep yok</p>';
    if (!inProgressList.hasChildNodes()) inProgressList.innerHTML = '<p style="text-align:center; color:#7f8c8d;">İşlemde talep yok</p>';
    if (!resolvedList.hasChildNodes()) resolvedList.innerHTML = '<p style="text-align:center; color:#7f8c8d;">Çözülen talep yok</p>';
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {

            // Tüm butonlardan active sınıfını kaldır
            filterBtns.forEach(b => b.classList.remove('active'));

            // Tıklanan butona active ekle
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            const sections = {
                'pending': document.getElementById('pending-requests-section'),
                'inprogress': document.getElementById('inprogress-requests-section'),
                'resolved': document.getElementById('resolved-requests-section')
            };

            // Hepsini gizle
            Object.values(sections).forEach(sec => sec.style.display = 'none');

            // Filtreye göre göster
            if (filter === 'all') {
                Object.values(sections).forEach(sec => sec.style.display = 'block');
            } else {
                sections[filter].style.display = 'block';
            }
        });
    });

    // Sayfa yüklenince "Tümü" aktif olsun
    window.addEventListener('DOMContentLoaded', () => {
        const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allBtn) allBtn.click();
    });
}


export async function setupRequests() {
    const siteId = sessionStorage.getItem('siteId');
    const userId = sessionStorage.getItem('userId');
    const isAdmin = sessionStorage.getItem('role') === 'admin';

    if (!siteId || !userId) return console.error('Site ID veya User ID bulunamadı!');

    const requests = isAdmin ? await fetchSiteRequests(siteId) : await fetchUserRequests(userId);
    displayRequests(requests);
    setupFilters();
}

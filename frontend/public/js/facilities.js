// Social Facilities Page Script
const API_BASE_URL = 'http://localhost:5000/api';
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const SITE_ID = selectedSite?.site_id || selectedSite?.id;
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Tesisleri bellekte tut
let facilitiesCache = [];

// DEBUG
console.log('🏢 [FACILITIES] selectedSite:', selectedSite);
console.log('🏢 [FACILITIES] SITE_ID:', SITE_ID);
console.log('🏢 [FACILITIES] currentUser:', currentUser);

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    if (!selectedSite || !SITE_ID) {
        alert('Site seçilmedi. Ana sayfaya yönlendiriliyorsunuz.');
        window.location.href = '/admin-dashboard.html';
        return;
    }

    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }

    // Sayfa başlığını güncelle
    const pageTitle = document.getElementById('page-title');
    if (pageTitle && selectedSite?.site_name) {
        pageTitle.textContent = `Sosyal Tesisler - ${selectedSite.site_name}`;
    }

    // Admin bilgisi güncelle
    const userInfo = document.getElementById('dashboard-user-info');
    if (userInfo && currentUser) {
        userInfo.innerHTML = `
            <div class="user-avatar" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #2196F3; color: white; border-radius: 50%; font-weight: bold;">${(currentUser.full_name || 'A')[0].toUpperCase()}</div>
            <div style="margin-left: 10px;">
                <div style="font-weight: 600;">${currentUser.full_name}</div>
                <div style="font-size: 12px; opacity: 0.8;">${currentUser.account_type}</div>
            </div>
        `;
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('selectedSite');
            window.location.href = '/admin-dashboard.html';
        });
    }

    // Sosyal tesisleri yükle
    loadFacilities();
    setupFacilityForm();
});

// Sosyal tesisleri API'den çek
async function loadFacilities() {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    console.log('📡 [LOAD] Tesisler yükleniyor...');
    console.log('📡 [LOAD] URL:', `${API_BASE_URL}/sites/${SITE_ID}/social-amenities`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${SITE_ID}/social-amenities`, { headers });
        console.log('📡 [LOAD] Response status:', response.status);
        
        const result = await response.json();
        console.log('📡 [LOAD] Response data:', result);
        
        if (!response.ok) throw new Error(result.message || 'Sosyal tesisler yüklenemedi');
        
        const facilities = result.data || result.facilities || [];
        console.log('📡 [LOAD] Facilities:', facilities);
        
        // Cache'e kaydet
        facilitiesCache = facilities;
        
        renderFacilities(facilities);
    } catch (error) {
        console.error('❌ [LOAD] Hata:', error);
        alert('Sosyal tesisler yüklenirken bir hata oluştu: ' + error.message);
    }
}

// Sosyal tesisleri render et
function renderFacilities(facilities) {
    const container = document.getElementById('facilities-list');
    if (!container) return;

    if (facilities.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#7f8c8d;">Henüz sosyal tesis kaydı bulunmamaktadır.</p>';
        return;
    }

    container.innerHTML = facilities.map(facility => {
        const statusColor = facility.status === 'ACTIVE' || facility.status === 'Açık' ? '#27ae60' : '#e74c3c';
        const statusText = facility.status === 'ACTIVE' || facility.status === 'Açık' ? 'Aktif' : 'Bakımda';
        const capacity = facility.capacity || facility.extra || '';
        const operatingHours = facility.operating_hours || facility.hours || '';

        return `
        <div class="facility-card" style="border:1px solid #e0e0e0;padding:20px;margin-bottom:15px;background:white;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                    <h3 style="margin:0 0 10px 0;color:#2c3e50;">${facility.name}</h3>
                    <p style="margin:0 0 10px 0;color:#7f8c8d;">${facility.description || ''}</p>
                    <div style="font-size:14px;color:#95a5a6;">
                        <span><strong>Kapasite:</strong> ${capacity || 'Belirtilmemiş'}</span>
                        ${operatingHours ? ` | <strong>Çalışma Saatleri:</strong> ${operatingHours}` : ''}
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;align-items:end;">
                    <span style="font-size:12px;padding:5px 12px;background:${statusColor};color:white;border-radius:15px;">
                        ${statusText}
                    </span>
                    <div style="display:flex;gap:5px;">
                        <button class="btn-edit" onclick="editFacility('${facility.id}')" style="padding:5px 10px;background:#3498db;color:white;border:none;border-radius:4px;cursor:pointer;">
                            Düzenle
                        </button>
                        <button class="btn-delete" onclick="deleteFacility('${facility.id}')" style="padding:5px 10px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;">
                            Sil
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

// Form kurulumu
function setupFacilityForm() {
    const form = document.getElementById('editFacilityForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
        if (!token) {
            alert('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
            window.location.href = '/login.html';
            return;
        }

        const facilityId = document.getElementById('facilityId')?.value || '';
        const name = document.getElementById('facilityName').value;
        const description = document.getElementById('facilityDescription')?.value || '';
        const capacity = document.getElementById('facilityCapacity')?.value || '';
        const operatingHours = document.getElementById('operatingHours')?.value || '';

        const data = { name, description, capacity, operating_hours: operatingHours, status: 'Açık' };
        
        console.log('📤 [SUBMIT] Form gönderiliyor...');
        console.log('📤 [SUBMIT] SITE_ID:', SITE_ID);
        console.log('📤 [SUBMIT] facilityId:', facilityId);
        console.log('📤 [SUBMIT] data:', data);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        try {
            let response;
            let url;
            if (facilityId) {
                // Güncelleme
                url = `${API_BASE_URL}/sites/${SITE_ID}/social-amenities/${facilityId}`;
                console.log('📤 [SUBMIT] PUT URL:', url);
                response = await fetch(url, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(data)
                });
            } else {
                // Yeni ekleme
                url = `${API_BASE_URL}/sites/${SITE_ID}/social-amenities`;
                console.log('📤 [SUBMIT] POST URL:', url);
                response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(data)
                });
            }

            console.log('📤 [SUBMIT] Response status:', response.status);
            const result = await response.json();
            console.log('📤 [SUBMIT] Response data:', result);

            if (!response.ok) throw new Error(result.message || result.error || 'İşlem başarısız');

            alert(facilityId ? 'Tesis güncellendi!' : 'Tesis eklendi!');
            form.reset();
            if (document.getElementById('facilityId')) document.getElementById('facilityId').value = '';
            await loadFacilities();
        } catch (error) {
            console.error('❌ [SUBMIT] Hata:', error);
            alert('İşlem sırasında bir hata oluştu: ' + error.message);
        }
    });
}

// Tesis düzenleme
window.editFacility = async function(facilityId) {
    console.log('✏️ [EDIT] facilityId:', facilityId);
    
    // Cache'den tesis bilgisini al
    const facility = facilitiesCache.find(f => f.id === facilityId);
    console.log('✏️ [EDIT] facility from cache:', facility);
    
    if (!facility) {
        alert('Tesis bilgisi bulunamadı. Sayfa yenileniyor...');
        await loadFacilities();
        return;
    }
    
    try {
        document.getElementById('facilityId').value = facility.id;
        document.getElementById('facilityName').value = facility.name;
        if (document.getElementById('facilityDescription')) {
            document.getElementById('facilityDescription').value = facility.description || '';
        }
        if (document.getElementById('facilityCapacity')) {
            document.getElementById('facilityCapacity').value = facility.extra || facility.capacity || '';
        }
        if (document.getElementById('operatingHours')) {
            document.getElementById('operatingHours').value = facility.hours || facility.operating_hours || '';
        }

        const formTitle = document.getElementById('form-title');
        if (formTitle) formTitle.textContent = 'Tesis Düzenle';
        
        // Forma scroll yap
        document.getElementById('editFacilityForm')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('❌ [EDIT] Hata:', error);
        alert('Tesis bilgisi yüklenirken hata oluştu.');
    }
};

// Tesis silme
window.deleteFacility = async function(facilityId) {
    if (!confirm('Bu tesisi silmek istediğinizden emin misiniz?')) return;

    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
        const response = await fetch(`${API_BASE_URL}/sites/${SITE_ID}/social-amenities/${facilityId}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Silme başarısız');
        }

        alert('Tesis silindi!');
        await loadFacilities();
    } catch (error) {
        console.error('❌ [DELETE] Hata:', error);
        alert('Tesis silinemedi: ' + error.message);
    }
};

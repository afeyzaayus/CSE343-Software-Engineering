// Social Facilities Page Script
const API_BASE_URL = 'http://localhost:3000/api';
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const SITE_ID = selectedSite?.site_id;
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

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
    
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${SITE_ID}/social-amenities`, { headers });
        if (!response.ok) throw new Error('Sosyal tesisler yüklenemedi');
        
        const result = await response.json();
        const facilities = result.data || result.facilities || [];
        
        renderFacilities(facilities);
    } catch (error) {
        console.error('Sosyal tesisler yüklenirken hata:', error);
        alert('Sosyal tesisler yüklenirken bir hata oluştu.');
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
        const statusColor = facility.status === 'ACTIVE' ? '#27ae60' : '#e74c3c';
        const statusText = facility.status === 'ACTIVE' ? 'Aktif' : 'Bakımda';

        return `
        <div class="facility-card" style="border:1px solid #e0e0e0;padding:20px;margin-bottom:15px;background:white;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                    <h3 style="margin:0 0 10px 0;color:#2c3e50;">${facility.name}</h3>
                    <p style="margin:0 0 10px 0;color:#7f8c8d;">${facility.description || ''}</p>
                    <div style="font-size:14px;color:#95a5a6;">
                        <span><strong>Kapasite:</strong> ${facility.capacity || 'Belirtilmemiş'}</span>
                        ${facility.operating_hours ? ` | <strong>Çalışma Saatleri:</strong> ${facility.operating_hours}` : ''}
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;align-items:end;">
                    <span style="font-size:12px;padding:5px 12px;background:${statusColor};color:white;border-radius:15px;">
                        ${statusText}
                    </span>
                    <div style="display:flex;gap:5px;">
                        <button class="btn-edit" onclick="editFacility(${facility.id})" style="padding:5px 10px;background:#3498db;color:white;border:none;border-radius:4px;cursor:pointer;">
                            Düzenle
                        </button>
                        <button class="btn-delete" onclick="deleteFacility(${facility.id})" style="padding:5px 10px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;">
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

        const facilityId = document.getElementById('facilityId').value;
        const name = document.getElementById('facilityName').value;
        const description = document.getElementById('facilityDescription')?.value || '';
        const capacity = document.getElementById('facilityCapacity')?.value || null;
        const operatingHours = document.getElementById('operatingHours')?.value || '';

        const data = { name, description, capacity, operating_hours: operatingHours, status: 'ACTIVE' };

        try {
            let response;
            if (facilityId) {
                // Güncelleme
                response = await fetch(`${API_BASE_URL}/sites/${SITE_ID}/social-amenities/${facilityId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                // Yeni ekleme
                response = await fetch(`${API_BASE_URL}/sites/${SITE_ID}/social-amenities`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            if (!response.ok) throw new Error('İşlem başarısız');

            alert(facilityId ? 'Tesis güncellendi!' : 'Tesis eklendi!');
            form.reset();
            await loadFacilities();
        } catch (error) {
            console.error('Form gönderme hatası:', error);
            alert('İşlem sırasında bir hata oluştu.');
        }
    });
}

// Tesis düzenleme
window.editFacility = async function(facilityId) {
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${SITE_ID}/social-amenities/${facilityId}`);
        if (!response.ok) throw new Error('Tesis bilgisi alınamadı');
        
        const facility = await response.json();
        
        document.getElementById('facilityId').value = facility.id;
        document.getElementById('facilityName').value = facility.name;
        if (document.getElementById('facilityDescription')) {
            document.getElementById('facilityDescription').value = facility.description || '';
        }
        if (document.getElementById('facilityCapacity')) {
            document.getElementById('facilityCapacity').value = facility.capacity || '';
        }
        if (document.getElementById('operatingHours')) {
            document.getElementById('operatingHours').value = facility.operating_hours || '';
        }

        document.getElementById('form-title').textContent = 'Tesis Düzenle';
    } catch (error) {
        console.error('Düzenleme hatası:', error);
        alert('Tesis bilgisi alınamadı.');
    }
};

// Tesis silme
window.deleteFacility = async function(facilityId) {
    if (!confirm('Bu tesisi silmek istediğinizden emin misiniz?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/sites/${SITE_ID}/social-amenities/${facilityId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Silme başarısız');

        alert('Tesis silindi!');
        await loadFacilities();
    } catch (error) {
        console.error('Silme hatası:', error);
        alert('Tesis silinemedi.');
    }
};

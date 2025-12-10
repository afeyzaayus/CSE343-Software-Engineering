// js/modules/facilities.js

// getAuthToken ve diğer API fonksiyonları için varsayılan bir import
// Projenizin yapısına göre './auth.js' yolunu kontrol edin.
// Not: Gerçek bir projede getAuthToken fonksiyonu ayrı bir dosyadan gelmelidir.
// Basit bir placeholder kullanalım:
const getAuthToken = () => "FAKE_ADMIN_TOKEN_12345"; 

const API_BASE = '/api/sites';

// ******************************************************
// API ENTEGRASYON FONKSIYONLARI (Gerçek API çağrılarınız)
// ******************************************************

/**
 * Tesis verisini API'den çeker.
 */
async function fetchFacilities(siteId) {
    try {
        const url = `${API_BASE}/${siteId}/social-amenities`;
        const res = await fetch(url, { 
            headers: { 'Authorization': `Bearer ${getAuthToken()}` } 
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Sosyal tesisler alınamadı');
        }
        return res.json();
    } catch (err) {
        console.error('fetchFacilities error:', err);
        // Hata durumunda boş array dönmek yerine hata fırlatılır
        throw err;
    }
}

/**
 * Yeni tesis oluşturur.
 */
async function createFacility(siteId, facilityData) {
    try {
        const url = `${API_BASE}/${siteId}/social-amenities`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(facilityData)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Sosyal tesis eklenemedi');
        }
        return res.json();
    } catch (err) {
        console.error('createFacility error:', err);
        throw err;
    }
}

/**
 * Mevcut tesisi günceller.
 */
async function updateFacility(siteId, facilityId, facilityData) {
    try {
        const url = `${API_BASE}/${siteId}/social-amenities/${facilityId}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(facilityData)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Sosyal tesis güncellenemedi');
        }
        return res.json();
    } catch (err) {
        console.error('updateFacility error:', err);
        throw err;
    }
}

/**
 * Tesis siler.
 */
async function deleteFacility(siteId, facilityId) {
    try {
        const url = `${API_BASE}/${siteId}/social-amenities/${facilityId}`;
        const res = await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Sosyal tesis silinemedi');
        }
        return true;
    } catch (err) {
        console.error('deleteFacility error:', err);
        throw err;
    }
}

// ******************************************************
// DOM MANIPULASYON VE YÖNETİM FONKSIYONLARI
// ******************************************************

// DOM element referansları
const facilitiesContainer = document.getElementById('facilities-list');
const formCard = document.getElementById('form-card');
const formTitle = document.getElementById('form-title');
const form = document.getElementById('editFacilityForm');
const cancelBtn = document.getElementById('cancel-edit-btn');
const saveBtn = document.getElementById('save-btn');

/**
 * Tesis verisini alıp HTML kartını oluşturan fonksiyon
 */
function renderFacilityCard(facility) {
    const card = document.createElement('div');
    const statusClass = 
        facility.status === 'Açık' ? 'paid' : 
        (facility.status === 'Rezervasyon Gereklidir' ? 'pending' : 'unpaid');
    
    // Textarea'dan gelen metni satırlara bölüp listeye dönüştürür
    const hoursHTML = (facility.hours || "").split('\n').filter(h => h.trim() !== '').map(item => {
        const parts = item.split(':');
        if (parts.length > 1) {
            return `<p><strong>${parts[0].trim()}:</strong> ${parts.slice(1).join(':').trim()}</p>`;
        }
        return `<p>${item}</p>`;
    }).join('');

    const rulesHTML = (facility.rules || "").split('\n').filter(r => r.trim() !== '').map(rule => 
        `<li>${rule}</li>`
    ).join('');
    
    const descriptionHTML = facility.extra ? 
        `<div class="facility-description">
            <h4><i class="fas fa-info-circle"></i> Ek Bilgiler / Özellikler</h4>
            <p>${facility.extra}</p>
        </div>` : '';

    card.classList.add('facility-card');
    card.dataset.id = facility.id;
    card.innerHTML = `
        <div class="facility-header">
            <div class="facility-title">
                <i class="fas fa-swimming-pool"></i> ${facility.name}
            </div>
            <div class="facility-actions-admin">
                <span class="status ${statusClass}">${facility.status}</span>
                <button class="edit-btn" data-id="${facility.id}"><i class="fas fa-edit"></i> Düzenle</button>
                <button class="delete-btn" data-id="${facility.id}"><i class="fas fa-trash"></i> Sil</button>
            </div>
        </div>
        
        <p>${facility.description || ''}</p> 

        <div class="facility-info">
            <div class="facility-hours">
                <h4><i class="fas fa-clock"></i> Çalışma Saatleri</h4>
                ${hoursHTML}
            </div>
            
            <div class="facility-rules">
                <h4><i class="fas fa-list-alt"></i> Kullanım Kuralları</h4>
                <ul>
                    ${rulesHTML}
                </ul>
            </div>
        </div>
        ${descriptionHTML}
    `;
    
    return card;
}

/**
 * Formu doldurur ve modu ayarlar (Yeni Ekle/Düzenle).
 */
function populateForm(facility, isNew = true) {
    document.getElementById('facilityId').value = facility.id || '';
    document.getElementById('facilityName').value = facility.name || '';
    document.getElementById('facilityDescription').value = facility.description || '';
    document.getElementById('facilityStatus').value = facility.status || 'Açık';
    document.getElementById('facilityHours').value = facility.hours || '';
    document.getElementById('facilityRules').value = facility.rules || '';
    document.getElementById('facilityExtraInfo').value = facility.extra || '';

    formTitle.textContent = isNew ? 'Yeni Sosyal Tesis Ekle' : `${facility.name} Bilgilerini Düzenle`;
    saveBtn.textContent = isNew ? 'Kaydet' : 'Güncelle';
    cancelBtn.style.display = isNew ? 'none' : 'inline-block';
    
    // Eğer düzenleme modundaysak, formu ekranın üstüne kaydır
    if (!isNew) {
        formCard.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Tesis listesini API'den çekip DOM'a render eder.
 */
async function loadFacilities(siteId) {
    facilitiesContainer.innerHTML = '<p style="text-align: center; color: #777;">Tesisler yükleniyor...</p>';
    try {
        const facilities = await fetchFacilities(siteId);
        
        facilitiesContainer.innerHTML = '';
        if (facilities.length === 0) {
            facilitiesContainer.innerHTML = '<p style="text-align: center; color: #e74c3c; font-weight: bold;">Henüz tanımlanmış sosyal tesis bulunmamaktadır.</p>';
        }

        facilities.forEach(facility => {
            facilitiesContainer.appendChild(renderFacilityCard(facility));
        });

    } catch (error) {
        facilitiesContainer.innerHTML = `<p style="text-align: center; color: red;">Hata: Tesisler yüklenemedi. (${error.message})</p>`;
    }
}

/**
 * Ana Başlatma Fonksiyonu. Tüm event listener'ları kurar.
 */
function setupFacilities() {
    // Site ID'sini session/local storage'dan veya URL'den alın
    const siteId = 'exampleSiteId'; // Yönetim panelinden gelen gerçek Site ID
    
    if (!siteId) {
        facilitiesContainer.innerHTML = '<p style="text-align: center; color: red;">Hata: Site ID bulunamadı. Lütfen oturum açın.</p>';
        return;
    }

    loadFacilities(siteId);

    // Formu başlangıçta 'Yeni Ekle' moduna ayarla
    populateForm({ id: null }, true); 

    // İptal Butonu İşlevi (Düzenleme modundan çıkmak için)
    cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        populateForm({ id: null }, true); // Formu temizle ve Yeni moduna getir
    });

    // Tesis Kartlarına Ait Butonlara Genel Tıklama Dinleyicisi
    facilitiesContainer.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        const facilityId = editBtn?.dataset.id || deleteBtn?.dataset.id;
        
        if (!facilityId) return;

        if (editBtn) {
            try {
                // Tesisin mevcut verilerini çek
                const facilities = await fetchFacilities(siteId);
                const facility = facilities.find(f => f.id === facilityId);
                
                if (facility) {
                    populateForm(facility, false); // Düzenleme moduna geç
                }
            } catch (error) {
                alert('Tesis verisi yüklenirken hata oluştu: ' + error.message);
            }

        } else if (deleteBtn) {
            const facilityName = deleteBtn.closest('.facility-card').querySelector('.facility-title').textContent.trim();
            if (confirm(`"${facilityName}" tesisini silmek istediğinizden emin misiniz?`)) {
                try {
                    await deleteFacility(siteId, facilityId);
                    alert('Tesis başarıyla silindi.');
                    loadFacilities(siteId); // Listeyi yeniden yükle
                } catch (error) {
                    alert('Silme hatası: ' + error.message);
                }
            }
        }
    });

    // Form Gönderme İşlevi (Kaydet/Güncelle)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const facilityId = document.getElementById('facilityId').value;
        const facilityName = document.getElementById('facilityName').value;
        
        const facilityData = {
            name: facilityName,
            description: document.getElementById('facilityDescription').value,
            status: document.getElementById('facilityStatus').value,
            hours: document.getElementById('facilityHours').value,
            rules: document.getElementById('facilityRules').value,
            extra: document.getElementById('facilityExtraInfo').value
        };

        try {
            if (facilityId) {
                // Güncelleme
                await updateFacility(siteId, facilityId, facilityData);
                alert(`${facilityName} başarıyla güncellendi!`);
            } else {
                // Yeni Oluşturma
                await createFacility(siteId, facilityData);
                alert(`${facilityName} başarıyla eklendi!`);
            }
            
            populateForm({ id: null }, true); // Formu Yeni Ekle moduna geri getir
            loadFacilities(siteId); // Listeyi yeniden yükle
        } catch (error) {
            alert('İşlem sırasında hata oluştu: ' + error.message);
        }
    });
}

// Sayfa yüklendiğinde başlatılması için export edilir
export { setupFacilities, fetchFacilities, createFacility, updateFacility, deleteFacility };
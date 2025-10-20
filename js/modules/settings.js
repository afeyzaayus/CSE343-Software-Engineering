// js/modules/settings.js

import { apiCall } from './api.js';
import { openModal, closeModal } from './ui.js';

// --- Global Sabitler ve Endpointler ---
const SITE_ID = localStorage.getItem('selectedSite'); 
const SETTINGS_ENDPOINT = `/api/sites/${SITE_ID}/settings`; // PUT ile güncellenir
const USER_PROFILE_ENDPOINT = `/api/users/me`; // Kullanıcının veya yöneticinin profil bilgisi

// --- 1. Ayarları Yükleme (GET) ---
async function loadSettings() {
    if (!SITE_ID) return;

    // Kullanıcı/Yönetici Profilini Çek
    const profileResponse = await apiCall(USER_PROFILE_ENDPOINT, 'GET', null, true);
    if (profileResponse.ok) {
        const profile = await profileResponse.json();
        document.getElementById('managerName').value = profile.fullName || '';
        document.getElementById('managerPhone').value = profile.phone || '';
        document.getElementById('managerEmail').value = profile.email || '';
    }

    // Site Ayarlarını Çek
    const settingsResponse = await apiCall(SETTINGS_ENDPOINT, 'GET', null, true);
    if (settingsResponse.ok) {
        const settings = await settingsResponse.json();

        document.getElementById('siteName').value = settings.siteName || '';
        document.getElementById('siteAddress').value = settings.siteAddress || '';
        document.getElementById('totalApartments').value = settings.totalApartments || '';
        document.getElementById('totalBlocks').value = settings.totalBlocks || '';
        document.getElementById('sitePhone').value = settings.sitePhone || '';

        // Aidat Ayarları
        document.getElementById('duesAmount').value = settings.dues?.amount || '';
        document.getElementById('duesDueDate').value = settings.dues?.dueDate || '';
        document.getElementById('lateFeeRate').value = settings.dues?.lateFeeRate || '';
    }
}

// --- 2. Ayar Formları Gönderimi (PUT) ---
async function handleSettingsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    let endpoint = '';
    let data = {};

    if (form.id === 'siteSettingsForm') {
        endpoint = SETTINGS_ENDPOINT;
        data = {
            siteName: form.querySelector('#siteName').value,
            siteAddress: form.querySelector('#siteAddress').value,
            totalApartments: Number(form.querySelector('#totalApartments').value),
            totalBlocks: Number(form.querySelector('#totalBlocks').value),
            sitePhone: form.querySelector('#sitePhone').value
        };
    } else if (form.id === 'managerSettingsForm') {
        endpoint = USER_PROFILE_ENDPOINT;
        data = {
            fullName: form.querySelector('#managerName').value,
            phone: form.querySelector('#managerPhone').value,
            email: form.querySelector('#managerEmail').value
        };
    } else if (form.id === 'duesSettingsForm') {
        endpoint = SETTINGS_ENDPOINT;
        data = {
            dues: {
                amount: Number(form.querySelector('#duesAmount').value),
                dueDate: Number(form.querySelector('#duesDueDate').value),
                lateFeeRate: Number(form.querySelector('#lateFeeRate').value)
            }
        };
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Kaydediliyor...';
    submitButton.disabled = true;

    const response = await apiCall(endpoint, 'PUT', data, true);

    if (response.ok) {
        alert('Ayarlar başarıyla kaydedildi!');
        loadSettings();
    } else {
        const error = await response.json();
        alert(`Ayarlar kaydedilemedi: ${error.message || 'Hata oluştu.'}`);
    }

    submitButton.textContent = originalText;
    submitButton.disabled = false;
}

// --- 3. Tehlike Bölgesi (Danger Zone) ---
function setupDangerZoneListeners() {
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmationMessage = document.getElementById('confirmationMessage');

    let currentAction = null;

    document.querySelectorAll('.danger-item button').forEach(btn => {
        btn.onclick = function() {
            currentAction = this.id;
            let message = "Bu işlem geri alınamaz. Devam etmek istiyor musunuz?";
            if (currentAction === 'resetDatabaseBtn') message = "Tüm veritabanı sıfırlanacak. Emin misiniz?";
            else if (currentAction === 'deleteAllDataBtn') message = "Tüm site verileri silinecek. Emin misiniz?";
            else if (currentAction === 'deleteAccountBtn') message = "Yönetici hesabı silinecek. Emin misiniz?";

            confirmationMessage.textContent = message;
            openModal('confirmationModal');
        };
    });

    confirmBtn.onclick = async function() {
        closeModal('confirmationModal');

        let endpoint = '';
        let successMessage = '';

        if (currentAction === 'resetDatabaseBtn') {
            endpoint = `/api/admin/database/reset`;
            successMessage = 'Veritabanı sıfırlandı.';
        } else if (currentAction === 'deleteAllDataBtn') {
            endpoint = `/api/admin/sites/${SITE_ID}/delete-all`;
            successMessage = 'Tüm site verileri silindi.';
        } else if (currentAction === 'deleteAccountBtn') {
            endpoint = `/api/admin/account/delete`;
            successMessage = 'Hesap silindi. Çıkış yapılıyor.';
        }

        if (endpoint) {
            const response = await apiCall(endpoint, 'DELETE', null, true);
            if (response.ok) {
                alert(successMessage);
                if (currentAction === 'deleteAccountBtn') {
                    localStorage.clear();
                    window.location.href = 'login.html';
                } else {
                    window.location.reload();
                }
            } else {
                alert('İşlem başarısız: Yetki veya sunucu hatası.');
            }
        }
        currentAction = null;
    };

    cancelBtn.onclick = () => closeModal('confirmationModal');
}

// --- 4. Modül Başlatma ---
export function setupSettings() {
    loadSettings();
    setupDangerZoneListeners();
    document.querySelectorAll('.settings-content form').forEach(form => {
        form.addEventListener('submit', handleSettingsSubmit);
    });
}

// js/main.js (FULL VE KESİNLEŞMİŞ VERSİYON)

// =================================================================
// 1. TEMEL MODÜLLER
// =================================================================

// Auth Modülü: Giriş/Kayıt, Token yönetimi
// setupAuthForms, form event'lerini dinlemek için gereklidir.
import { setupAuthListeners, setupAuthForms } from './modules/auth.js'; 

// UI Modülü: Modal açma/kapama, sekme geçişi
// openModal ve closeModal, auth.js'e parametre olarak gönderilir.
import { openModal, closeModal, setupGlobalModalListeners, setupTabSwitching } from './modules/ui.js'; 

// =================================================================
// 2. ANA UYGULAMA MODÜLLERİ
// =================================================================

import { setupAnnouncements } from './modules/announcement.js';
import { setupPayments } from './modules/payments.js';
import { setupFacilities } from './modules/facilities.js';
import { setupRequests } from './modules/requests.js';
import { setupResidents } from './modules/residents.js'; 
import { setupSettings } from './modules/settings.js'; 
import { setupDashboard } from './modules/dashboard.js'; 


// =================================================================
// 3. UYGULAMA BAŞLANGICI
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Frontend Uygulaması Başlatılıyor...');
    
    // Global UI dinleyicilerini başlat
    setupGlobalModalListeners();
    setupTabSwitching(); // Login sayfasındaki Giriş/Kayıt sekmeleri için

    // Kimlik doğrulama dinleyicilerini başlat (Token kontrolü vb.)
    setupAuthListeners();

    // Auth formlarını bağla
    setupAuthForms(openModal, closeModal);
    
    // Sayfa bazlı modül başlatma
    // Bu kısım, hangi HTML dosyasında olduğumuza göre ilgili modülü çalıştırır.
    const path = window.location.pathname;

    if (path.includes('dashboard.html')) {
        setupDashboard();
    }
    if (path.includes('announcements.html')) {
        setupAnnouncements();
    }
    if (path.includes('payment.html')) {
        setupPayments();
    }
    if (path.includes('socialfacilities.html')) {
        setupFacilities();
    }
    if (path.includes('complaint_request.html')) {
        setupRequests();
    }
    if (path.includes('residents.html')) {
        setupResidents();
    }
    if (path.includes('settings.html')) {
        setupSettings();
    }
});
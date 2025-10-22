// js/modules/residents.js
import { getAuthToken } from './auth.js';
import { openModal, closeModal } from './ui.js';

const API_BASE = '/api/sites';
const SITE_ID = localStorage.getItem('selectedSite');
const USER_ID = localStorage.getItem('userId'); // Giriş yapan kullanıcı ID'si
const ROLE = localStorage.getItem('role'); // 'admin' veya 'user'

// --- API Fonksiyonları ---

async function fetchResidents(siteId) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/residents`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error('Sakinler alınamadı');
        return await res.json();
    } catch (err) {
        console.error(err);
        alert(err.message);
        return [];
    }
}

async function fetchUserProfile(userId) {
    try {
        const res = await fetch(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error('Profil bilgileri alınamadı');
        return await res.json();
    } catch (err) {
        console.error(err);
        alert(err.message);
        return null;
    }
}

async function updateResident(siteId, userId, data) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/residents/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Güncelleme başarısız');
        }
        return await res.json();
    } catch (err) {
        console.error(err);
        alert(err.message);
        throw err;
    }
}

// --- UI Fonksiyonları ---

function renderResidentItem(resident, container, isAdmin) {
    const div = document.createElement('div');
    div.classList.add('resident-item');
    div.dataset.id = resident.id;

    if (isAdmin) {
        div.innerHTML = `
            <h3>${resident.fullName}</h3>
            <p>Daire: ${resident.apartment} | Araç: ${resident.vehicle || '-'}</p>
            <button class="edit-btn">Güncelle</button>
        `;
        container.appendChild(div);

        div.querySelector('.edit-btn').addEventListener('click', async () => {
            const newApartment = prompt('Daire numarası:', resident.apartment);
            const newVehicle = prompt('Araç plaka:', resident.vehicle || '');
            if (!newApartment) return;
            const updated = await updateResident(SITE_ID, resident.id, {
                apartment: newApartment,
                vehicle: newVehicle
            });
            div.querySelector('p').textContent = `Daire: ${updated.apartment} | Araç: ${updated.vehicle || '-'}`;
        });
    } else {
        div.innerHTML = `
            <h3>${resident.fullName}</h3>
            <p>Daire: ${resident.apartment}</p>
            <p>Araç: ${resident.vehicle || '-'}</p>
        `;
        container.appendChild(div);
    }
}

async function renderResidents() {
    const container = document.querySelector('#residents-list');
    if (!SITE_ID || !USER_ID) return;

    container.innerHTML = '';

    if (ROLE === 'admin') {
        const residents = await fetchResidents(SITE_ID);
        residents.forEach(res => renderResidentItem(res, container, true));
    } else {
        const profile = await fetchUserProfile(USER_ID);
        if (profile) renderResidentItem(profile, container, false);
    }
}

// --- Modül Başlatma ---

export function setupResidents() {
    renderResidents();
}

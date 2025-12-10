// js/modules/payments.js
import { getAuthToken } from './auth.js';

const API_BASE = '/api/sites';

// Kullanıcının aidat durumunu alma
async function fetchUserFees(userId) {
    try {
        const res = await fetch(`/api/users/${userId}/fees`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Aidat bilgileri alınamadı');
        }

        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Yöneticinin site aidatlarını alma
async function fetchSiteFees(siteId) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/fees`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Site aidatları alınamadı');
        }

        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Yeni aidat ekleme (Yönetici)
async function createFee(siteId, feeData) {
    try {
        const res = await fetch(`${API_BASE}/${siteId}/fees`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feeData)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Aidat eklenemedi');
        }

        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// Aidat ödeme durumu güncelleme (Kullanıcı veya Yönetici)
async function payFee(userId, feeId) {
    try {
        const res = await fetch(`/api/users/${userId}/fees/${feeId}/pay`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Aidat ödeme durumu güncellenemedi');
        }

        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// DOM ile ilişkilendirme ve event listener ekleme
function setupPayments() {
    const siteId = sessionStorage.getItem('siteId');
    const userId = sessionStorage.getItem('userId');
    if (!siteId || !userId) {
        console.error('Site ID veya User ID bulunamadı!');
        return;
    }

    const feesContainer = document.querySelector('#fees-list');
    const createBtn = document.querySelector('#create-fee-btn');

    // Kullanıcı mı yoksa yönetici mi kontrolü
    const isAdmin = sessionStorage.getItem('role') === 'admin';

    if (isAdmin) {
        // Yöneticinin site aidatlarını yüklemesi
        fetchSiteFees(siteId).then(fees => {
            feesContainer.innerHTML = '';
            fees.forEach(f => {
                const div = document.createElement('div');
                div.classList.add('fee-item');
                div.dataset.id = f.id;
                div.innerHTML = `
                    <h3>${f.month} - ${f.amount}₺</h3>
                    <p>Ödeme Durumu: ${f.paid ? 'Ödendi' : 'Ödenmedi'}</p>
                    <button class="pay-btn">Ödeme Durumu Güncelle</button>
                `;
                feesContainer.appendChild(div);
            });

            feesContainer.querySelectorAll('.pay-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const feeId = e.target.closest('.fee-item').dataset.id;
                    await payFee(userId, feeId);
                    e.target.closest('.fee-item').querySelector('p').textContent = 'Ödeme Durumu: Ödendi';
                });
            });
        });

        // Yeni aidat ekleme
        if (createBtn) {
            createBtn.addEventListener('click', async () => {
                const month = prompt('Ay:');
                const amount = prompt('Aidat Miktarı (₺):');
                if (!month || !amount) return;

                const newFee = await createFee(siteId, { month, amount });
                const div = document.createElement('div');
                div.classList.add('fee-item');
                div.dataset.id = newFee.id;
                div.innerHTML = `
                    <h3>${newFee.month} - ${newFee.amount}₺</h3>
                    <p>Ödeme Durumu: ${newFee.paid ? 'Ödendi' : 'Ödenmedi'}</p>
                    <button class="pay-btn">Ödeme Durumu Güncelle</button>
                `;
                feesContainer.appendChild(div);
            });
        }
    } else {
        // Kullanıcının kendi aidat durumunu görüntülemesi
        fetchUserFees(userId).then(fees => {
            feesContainer.innerHTML = '';
            fees.forEach(f => {
                const div = document.createElement('div');
                div.classList.add('fee-item');
                div.dataset.id = f.id;
                div.innerHTML = `
                    <h3>${f.month} - ${f.amount}₺</h3>
                    <p>Ödeme Durumu: ${f.paid ? 'Ödendi' : 'Ödenmedi'}</p>
                    ${!f.paid ? `<button class="pay-btn">Öde</button>` : ''}
                `;
                feesContainer.appendChild(div);
            });

            feesContainer.querySelectorAll('.pay-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const feeId = e.target.closest('.fee-item').dataset.id;
                    await payFee(userId, feeId);
                    e.target.closest('.fee-item').querySelector('p').textContent = 'Ödeme Durumu: Ödendi';
                    e.target.remove();
                });
            });
        });
    }
}

export { setupPayments, fetchUserFees, fetchSiteFees, createFee, payFee };

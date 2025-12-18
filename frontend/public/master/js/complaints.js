import { createStatusBadge, showToast, formatDate } from './common.js';

const API_BASE_URL = 'http://localhost:3000/api/master/complaints';

// Token al
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderComplaints();
    document.getElementById('complaintFilter').addEventListener('change', fetchAndRenderComplaints);
});

// Şikayetleri getir ve listele
async function fetchAndRenderComplaints() {
    const filterValue = document.getElementById('complaintFilter').value;
    let url = API_BASE_URL;
    if (filterValue && filterValue !== 'all') {
        url += `?status=${filterValue.toUpperCase()}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    renderComplaints(data.complaints || []);
}
function getCategoryText(category) {
    switch (category) {
        case 'TECHNICAL_SUPPORT': return 'Teknik Destek';
        case 'RESTORE': return 'Geri Yükleme';
        case 'REQUEST': return 'Talep';
        case 'FEATURE_REQUEST': return 'Yeni Özellik';
        case 'GENERAL': return 'Genel';
        case 'OTHER': return 'Diğer';
        default: return category || '';
    }
}
// Şikayetleri ekrana bas
function renderComplaints(complaints) {
    const list = document.getElementById('complaintsList');
    const emptyState = document.getElementById('complaintsEmptyState');
    const totalCount = document.getElementById('totalComplaintsCount');
    const pendingCount = document.getElementById('pendingComplaintsCount');
    const resolvedCount = document.getElementById('resolvedComplaintsCount');

    list.innerHTML = '';
    totalCount.textContent = complaints.length;
    pendingCount.textContent = complaints.filter(c => c.status === 'PENDING').length;
    resolvedCount.textContent = complaints.filter(c => c.status === 'RESOLVED').length;

    if (complaints.length === 0) {
        emptyState.style.display = '';
        return;
    } else {
        emptyState.style.display = 'none';
    }

    complaints.forEach(complaint => {
        const item = document.createElement('div');
        item.className = 'complaint-item';
        item.innerHTML = `
            <div class="complaint-header">
                <div class="complaint-title-row">
                    <strong class="complaint-title">${complaint.title}</strong>
                    <span class="badge badge-status badge-${complaint.status.toLowerCase()}">${getStatusText(complaint.status)}</span>
                </div>
                <div class="complaint-meta">
                    <span class="complaint-category">${getCategoryText(complaint.category)}</span>
                    <span class="complaint-date">${formatDate(complaint.created_at)}</span>
                </div>
            </div>
             <div class="complaint-content">
                <span>${complaint.content ? complaint.content.substring(0, 100) + (complaint.content.length > 100 ? "..." : "") : ""}</span>
            </div>
           

        `;
        item.onclick = () => openComplaintDetailModal(complaint.id);
        list.appendChild(item);
    });
}

// Şikayet detay modalını aç
async function openComplaintDetailModal(complaintId) {
    const res = await fetch(`${API_BASE_URL}/${complaintId}`);
    const data = await res.json();
    const complaint = data.complaint;

    const body = document.getElementById('complaintDetailBody');
    body.innerHTML = `
        <p><strong>Konu:</strong> ${complaint.title}</p>
        <p><strong>Açıklama:</strong> ${complaint.content}</p>
        <p><strong>Kategori:</strong> ${getCategoryText(complaint.category)}</p>
        <p><strong>Durum:</strong> <span class="badge badge-status badge-${complaint.status.toLowerCase()}">${getStatusText(complaint.status)}</span></p>
        <p><strong>Oluşturulma:</strong> ${formatDate(complaint.created_at)}</p>
        <p><strong>Admin:</strong> ${complaint.admin?.name || complaint.admin?.id || ''}</p>
        <p><strong>Email:</strong> ${complaint.admin?.email ? complaint.admin.email : ''}</p>
        ${complaint.admin?.company_name ? `<p><strong>Şirket:</strong> ${complaint.admin.company_name}</p>` : ''}
        ${complaint.admin?.company_code ? `<p><strong>Şirket Kodu:</strong> ${complaint.admin.company_code}</p>` : ''}
        ${complaint.master_note ? `<hr><p><strong>Master Notu:</strong> <span id="masterNoteText">${complaint.master_note}</span></p>` : ''}
    `;
    // ...existing code...
    // Aksiyonlar (tek bir kaydet butonu)
    const actions = document.getElementById('complaintDetailActions');
    actions.innerHTML = `
        <form id="updateComplaintForm" onsubmit="return false;">
            <label>Durum Güncelle:</label>
            <select id="statusSelect">
                <option value="PENDING" ${complaint.status === 'PENDING' ? 'selected' : ''}>Bekleyen</option>
                <option value="IN_PROGRESS" ${complaint.status === 'IN_PROGRESS' ? 'selected' : ''}>İşlemde</option>
                <option value="RESOLVED" ${complaint.status === 'RESOLVED' ? 'selected' : ''}>Çözülen</option>
                <option value="REJECTED" ${complaint.status === 'REJECTED' ? 'selected' : ''}>Reddedilen</option>
            </select>
            <hr>
            <label>Master Notu Ekle/Güncelle:</label>
            <textarea id="masterNoteInput">${complaint.master_note || ''}</textarea>
            <button class="btn btn-primary" id="saveComplaintBtn">Kaydet</button>
        </form>
    `;

    document.getElementById('complaintDetailModal').style.display = 'flex';

    // Tek kaydet butonuyla hem durum hem notu güncelle
    document.getElementById('saveComplaintBtn').onclick = async function (e) {
        e.preventDefault();
        await updateStatusAndNote(complaint.id);
    };
}

// Modalı kapat
function closeComplaintDetailModal() {
    document.getElementById('complaintDetailModal').style.display = 'none';
}

// Durum ve master notu birlikte güncelle
async function updateStatusAndNote(complaintId) {
    const status = document.getElementById('statusSelect').value;
    const note = document.getElementById('masterNoteInput').value;

    // Durum güncelle
    await fetch(`${API_BASE_URL}/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });

    // Master notu güncelle
    await fetch(`${API_BASE_URL}/${complaintId}/master-note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
    });

    closeComplaintDetailModal();
    fetchAndRenderComplaints();
}

// Durum metni
function getStatusText(status) {
    switch (status) {
        case 'PENDING': return 'Bekleyen';
        case 'IN_PROGRESS': return 'İşlemde';
        case 'RESOLVED': return 'Çözülen';
        case 'REJECTED': return 'Reddedilen';
        default: return status;
    }
}

// Modalı dışarı tıklayınca kapatmak için (isteğe bağlı)
window.onclick = function(event) {
    const modal = document.getElementById('complaintDetailModal');
    if (event.target === modal) {
        closeComplaintDetailModal();
    }
};

// complaints.js dosyanın sonuna ekle
window.closeComplaintDetailModal = closeComplaintDetailModal;
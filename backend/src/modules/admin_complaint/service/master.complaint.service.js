import prisma from '../../../prisma/prismaClient.js';

/**
 * Tüm admin şikayetlerini listele (filtre, sayfalama eklenebilir)
 * @param {Object} [filter]
 * @returns {Promise<Array>}
 */
async function listAdminComplaintsService(filter = {}) {
    const complaints = await prisma.adminComplaint.findMany({
        where: filter,
        orderBy: { created_at: 'desc' },
        include: {
            admin: { select: { id: true, full_name: true, email: true } }
        }
    });

    const result = complaints.map(complaint => ({
        id: complaint.id,
        title: complaint.title,
        content: complaint.content,
        category: complaint.category,
        status: complaint.status,
        created_at: complaint.created_at,
        updated_at: complaint.updated_at,
        master_note: complaint.master_note,
        admin: complaint.admin
            ? { id: complaint.admin.id, name: complaint.admin.full_name, email: complaint.admin.email }
            : null
    }));
    return result;
}

/**
 * Tek bir şikayeti ID ile getir (admin bilgisiyle)
 * @param {number} complaintId
 * @returns {Promise<Object|null>}
 */
async function getAdminComplaintByIdService(complaintId) {
    const complaint = await prisma.adminComplaint.findUnique({
        where: { id: complaintId },
        include: {
            admin: { select: { id: true, full_name: true, email: true } }
        }
    });
    if (!complaint) return null;
    return {
        id: complaint.id,
        title: complaint.title,
        content: complaint.content,
        category: complaint.category,
        status: complaint.status,
        created_at: complaint.created_at,
        updated_at: complaint.updated_at,
        master_note: complaint.master_note,
        admin: complaint.admin
            ? { id: complaint.admin.id, name: complaint.admin.full_name, email: complaint.admin.email }
            : null
    };
}

/**
 * Şikayet durumunu güncelle (örn: in_progress, resolved, rejected)
 * @param {number} complaintId
 * @param {string} status
 * @returns {Promise<Object>}
 */
async function updateComplaintStatusService(complaintId, status) {
    return prisma.adminComplaint.update({
        where: { id: complaintId },
        data: { status }
    });
}

/**
 * Şikayete master user notu ekle
 * @param {number} complaintId
 * @param {string} note
 * @returns {Promise<Object>}
 */
async function addMasterNoteToComplaintService(complaintId, note) {
    return prisma.adminComplaint.update({
        where: { id: complaintId },
        data: { master_note: note }
    });
}

export {
    listAdminComplaintsService,
    getAdminComplaintByIdService,
    updateComplaintStatusService,
    addMasterNoteToComplaintService
};
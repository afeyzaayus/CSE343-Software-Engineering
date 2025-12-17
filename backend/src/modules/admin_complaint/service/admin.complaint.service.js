import prisma from '../../../prisma/prismaClient.js';

/**
 * Bireysel veya company manager adminlerin şikayet oluşturma servisi
 * @param {Object} complaintData
 * @param {number} complaintData.adminId
 * @param {'INDIVIDUAL'|'COMPANY_MANAGER'} complaintData.accountType
 * @param {string} complaintData.title
 * @param {string} complaintData.content
 * @param {string} [complaintData.category]
 * @returns {Promise<Object>}
 */
async function createAdminComplaintService(complaintData) {
    // Sadece bireysel ve company manager adminler şikayet oluşturabilir
    if (!['INDIVIDUAL', 'COMPANY_MANAGER'].includes(complaintData.accountType)) {
        throw new Error('Sadece bireysel veya şirket yöneticisi adminler şikayet oluşturabilir.');
    }

    // Admin var mı ve tipi doğru mu kontrolü (isteğe bağlı)
    const admin = await prisma.admin.findUnique({ where: { id: complaintData.adminId } });
    if (!admin || admin.account_type !== complaintData.accountType) {
        throw new Error('Geçersiz admin veya admin tipi.');
    }

    const newComplaint = await prisma.adminComplaint.create({
        data: {
            adminId: complaintData.adminId,
            accountType: complaintData.accountType,
            title: complaintData.title,
            content: complaintData.content,
            category: complaintData.category || null,
            status: 'PENDING'
        }
    });
    return newComplaint;
}

/**
 * Şikayet güncelleme servisi
 * @param {number} complaintId
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
async function updateAdminComplaintService(complaintId, updateData) {
    const updatedComplaint = await prisma.adminComplaint.update({
        where: { id: complaintId },
        data: updateData
    });
    return updatedComplaint;
}

/**
 * Şikayet silme servisi
 * @param {number} complaintId
 * @returns {Promise<Object>}
 */
async function deleteAdminComplaintService(complaintId) {
    const deletedComplaint = await prisma.adminComplaint.delete({
        where: { id: complaintId }
    });
    return deletedComplaint;
}

/**
 * Şikayet detayını getir (duruma göre master_note dahil)
 * @param {number} complaintId
 * @returns {Promise<Object|null>}
 */
async function getAdminComplaintDetailService(complaintId) {
    const complaint = await prisma.adminComplaint.findUnique({
        where: { id: complaintId },
        select: {
            id: true,
            adminId: true,
            accountType: true,
            title: true,
            content: true,
            category: true,
            status: true,
            created_at: true,
            updated_at: true,
            master_note: true
        }
    });
    // Sadece IN_PROGRESS veya RESOLVED ise master_note'u döndür
    if (complaint && (complaint.status === 'IN_PROGRESS' || complaint.status === 'RESOLVED')) {
        return complaint;
    } else if (complaint) {
        // Diğer durumlarda master_note'u gizle
        const { master_note, ...rest } = complaint;
        return rest;
    }
    return null;
}

/**
 * Admin şikayetlerini listeleme servisi (sadece ilgili adminin şikayetleri, duruma göre master_note dahil)
 * @param {number} adminId
 * @returns {Promise<Array>}
 */
async function getAdminComplaintsListService(adminId) {
    const complaints = await prisma.adminComplaint.findMany({
        where: { adminId },
        select: {
            id: true,
            adminId: true,
            accountType: true,
            title: true,
            content: true,
            category: true,
            status: true,
            created_at: true,
            updated_at: true,
            master_note: true
        }
    });
    // Sadece IN_PROGRESS veya RESOLVED ise master_note'u döndür
    return complaints.map(c =>
        (c.status === 'IN_PROGRESS' || c.status === 'RESOLVED')
            ? c
            : (() => { const { master_note, ...rest } = c; return rest; })()
    );
}

export {
    createAdminComplaintService,
    updateAdminComplaintService,
    deleteAdminComplaintService,
    getAdminComplaintDetailService,
    getAdminComplaintsListService
};

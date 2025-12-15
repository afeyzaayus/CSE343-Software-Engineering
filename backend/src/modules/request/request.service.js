// src/services/complaintsService.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Complaints Service - Business Logic Layer
 * Tüm şikayet işlemleri için business logic burada
 */

class ComplaintsService {
  
  /**
   * Tüm şikayetleri getir (filtreleme ile)
   * @param {Object} filters - Filtreleme parametreleri
   * @returns {Promise<Array>} Şikayet listesi
   */
  async getAllComplaints(filters) {
    const { siteId, status, category, userId } = filters;

    // Where clause oluştur
    let whereClause = {};

    // siteId string ise, site_id ile ara ve integer id kullan
    if (siteId) {
      // Önce site_id ile site'ı bul
      const site = await prisma.site.findUnique({
        where: { site_id: siteId },
        select: { id: true }
      });

      if (!site) {
        throw new Error('Site bulunamadı');
      }

      whereClause.siteId = site.id; // Integer id kullan
    }

    if (status && status !== 'all') {
      const statusMap = {
        'pending': 'PENDING',
        'inprogress': 'IN_PROGRESS',
        'resolved': 'RESOLVED',
        'cancelled': 'CANCELLED'
      };
      whereClause.status = statusMap[status.toLowerCase()];
    }

    if (category && category !== 'all') {
      const categoryMap = {
        'maintenance': 'MAINTENANCE',
        'complaint': 'COMPLAINT',
        'request': 'REQUEST',
        'other': 'OTHER'
      };
      whereClause.category = categoryMap[category.toLowerCase()];
    }

    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    const complaints = await prisma.complaints.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            block_id: true,
            apartment_no: true,
            phone_number: true
          }
        },
        sites: {
          select: {
            id: true,
            site_name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Format response
    return complaints.map(complaint => this.formatComplaint(complaint));
  }

  /**
   * Belirli bir kullanıcının şikayetlerini getir
   * @param {number} userId - Kullanıcı ID
   * @param {number} siteId - Site ID
   * @returns {Promise<Array>} Kullanıcının şikayetleri
   */
  async getUserComplaints(userId, siteId) {
    // site_id string ile site'ı bul
    const site = await prisma.site.findUnique({
      where: { site_id: siteId },
      select: { id: true }
    });

    if (!site) {
      throw new Error('Site bulunamadı');
    }

    const complaints = await prisma.complaints.findMany({
      where: {
        userId: parseInt(userId),
        siteId: site.id
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            block_id: true,
            apartment_no: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return complaints.map(complaint => this.formatComplaint(complaint));
  }

  /**
   * ID'ye göre şikayet detayını getir
   * @param {number} complaintId - Şikayet ID
   * @returns {Promise<Object>} Şikayet detayı
   */
  async getComplaintById(complaintId) {
    const complaint = await prisma.complaints.findUnique({
      where: { id: parseInt(complaintId) },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            block_id: true,
            apartment_no: true,
            phone_number: true
          }
        },
        sites: {
          select: {
            id: true,
            site_name: true,
            site_address: true
          }
        }
      }
    });

    if (!complaint) {
      throw new Error('Şikayet bulunamadı');
    }

    return this.formatComplaint(complaint);
  }

  /**
   * Yeni şikayet oluştur
   * @param {Object} complaintData - Şikayet verisi
   * @returns {Promise<Object>} Oluşturulan şikayet
   */
  async createComplaint(complaintData) {
    const { title, content, category, siteId, userId } = complaintData;

    // Validation
    if (!title || !content || !siteId || !userId) {
      throw new Error('Zorunlu alanlar eksik');
    }

    // Category validation
    const validCategories = ['MAINTENANCE', 'COMPLAINT', 'REQUEST', 'OTHER'];
    const categoryValue = category ? category.toUpperCase() : 'MAINTENANCE';
    
    if (!validCategories.includes(categoryValue)) {
      throw new Error('Geçersiz kategori');
    }

    // site_id ile site'ı bul
    const site = await prisma.site.findUnique({
      where: { site_id: siteId },
      select: { id: true }
    });

    if (!site) {
      throw new Error('Site bulunamadı');
    }

    // Kullanıcının bu site'a ait olup olmadığını kontrol et
    const user = await prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        siteId: site.id
      }
    });

    if (!user) {
      throw new Error('Bu site için şikayet oluşturamazsınız');
    }

    // Şikayet oluştur
    const complaint = await prisma.complaints.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: categoryValue,
        siteId: site.id,
        userId: parseInt(userId),
        status: 'PENDING'
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            block_id: true,
            apartment_no: true
          }
        },
        sites: {
          select: {
            id: true,
            site_name: true
          }
        }
      }
    });

    // TODO: Notification gönder
    // await this.sendNotificationToAdmin(siteId, complaint);

    return this.formatComplaint(complaint);
  }

  /**
   * Şikayet durumunu güncelle
   * @param {number} complaintId - Şikayet ID
   * @param {string} newStatus - Yeni durum
   * @returns {Promise<Object>} Güncellenmiş şikayet
   */
  async updateComplaintStatus(complaintId, newStatus) {
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Geçersiz durum: ' + newStatus + '. Geçerli durumlar: ' + validStatuses.join(', '));
    }

    // Mevcut complaint'i kontrol et
    const existingComplaint = await prisma.complaints.findUnique({
      where: { id: parseInt(complaintId) },
      include: { users: true, sites: true }
    });

    if (!existingComplaint) {
      throw new Error('Şikayet bulunamadı');
    }

    try {
      // Durumu güncelle
      const complaint = await prisma.complaints.update({
        where: { id: parseInt(complaintId) },
        data: { 
          status: newStatus,
          updated_at: new Date()
        },
        include: {
          users: {
            select: {
              id: true,
              full_name: true,
              block_id: true,
              apartment_no: true
            }
          },
          sites: {
            select: {
              id: true,
              site_name: true
            }
          }
        }
      });

      return this.formatComplaint(complaint);
    } catch (error) {
      console.error('Update complaint status error:', error);
      // Database enum hatasını yakala
      if (error.message && error.message.includes('Status')) {
        throw new Error('Durum değeri geçersiz. Lütfen: PENDING, IN_PROGRESS, RESOLVED, CANCELLED veya REJECTED kullanın.');
      }
      throw error;
    }
  }

  /**
   * Şikayeti sil
   * @param {number} complaintId - Şikayet ID
   * @returns {Promise<void>}
   */
  async deleteComplaint(complaintId) {
    const complaint = await prisma.complaints.findUnique({
      where: { id: parseInt(complaintId) }
    });

    if (!complaint) {
      throw new Error('Şikayet bulunamadı');
    }

    await prisma.complaints.delete({
      where: { id: parseInt(complaintId) }
    });
  }

  /**
   * Site için şikayet istatistikleri
   * @param {number} siteId - Site ID
   * @returns {Promise<Object>} İstatistikler
   */
  async getComplaintStats(siteId) {
    // site_id ile site'ı bul
    const site = await prisma.site.findUnique({
      where: { site_id: siteId },
      select: { id: true }
    });

    if (!site) {
      throw new Error('Site bulunamadı');
    }

    const stats = await prisma.complaints.groupBy({
      by: ['status', 'category'],
      where: {
        siteId: site.id
      },
      _count: {
        id: true
      }
    });

    const totalCount = await prisma.complaints.count({
      where: {
        siteId: site.id
      }
    });

    // Status bazlı özet
    const statusSummary = {
      pending: 0,
      inProgress: 0,
      resolved: 0,
      cancelled: 0
    };

    // Category bazlı özet
    const categorySummary = {
      maintenance: 0,
      complaint: 0,
      request: 0,
      other: 0
    };

    stats.forEach(stat => {
      // Status sayıları
      switch (stat.status) {
        case 'PENDING':
          statusSummary.pending += stat._count.id;
          break;
        case 'IN_PROGRESS':
          statusSummary.inProgress += stat._count.id;
          break;
        case 'RESOLVED':
          statusSummary.resolved += stat._count.id;
          break;
        case 'CANCELLED':
          statusSummary.cancelled += stat._count.id;
          break;
      }

      // Category sayıları
      switch (stat.category) {
        case 'MAINTENANCE':
          categorySummary.maintenance += stat._count.id;
          break;
        case 'COMPLAINT':
          categorySummary.complaint += stat._count.id;
          break;
        case 'REQUEST':
          categorySummary.request += stat._count.id;
          break;
        case 'OTHER':
          categorySummary.other += stat._count.id;
          break;
      }
    });

    return {
      total: totalCount,
      byStatus: statusSummary,
      byCategory: categorySummary,
      breakdown: stats
    };
  }

  // ============= Helper Methods =============

  /**
   * Şikayet objesini formatla
   * @param {Object} complaint - Ham şikayet objesi
   * @returns {Object} Formatlanmış şikayet
   */
  formatComplaint(complaint) {
    return {
      ...complaint,
      categoryText: this.getCategoryText(complaint.category),
      categoryClass: this.getCategoryClass(complaint.category),
      statusText: this.getStatusText(complaint.status),
      statusClass: this.getStatusClass(complaint.status)
    };
  }

  getCategoryText(category) {
    const categoryTexts = {
      'MAINTENANCE': 'Bakım',
      'COMPLAINT': 'Şikayet',
      'REQUEST': 'Talep',
      'OTHER': 'Diğer'
    };
    return categoryTexts[category] || category;
  }

  getCategoryClass(category) {
    const categoryClasses = {
      'MAINTENANCE': 'category-maintenance',
      'COMPLAINT': 'category-complaint',
      'REQUEST': 'category-request',
      'OTHER': 'category-other'
    };
    return categoryClasses[category] || 'category-other';
  }

  getStatusText(status) {
    const statusTexts = {
      'PENDING': 'Bekleyen',
      'IN_PROGRESS': 'İşlemde',
      'RESOLVED': 'Çözüldü',
      'CANCELLED': 'İptal Edildi'
    };
    return statusTexts[status] || status;
  }

  getStatusClass(status) {
    const statusClasses = {
      'PENDING': 'status-pending',
      'IN_PROGRESS': 'status-inprogress',
      'RESOLVED': 'status-resolved',
      'CANCELLED': 'status-cancelled'
    };
    return statusClasses[status] || 'status-pending';
  }

  // TODO: Notification methods
  // async sendNotificationToAdmin(siteId, complaint) {
  //   // Firebase/FCM implementation
  // }

  // async sendNotificationToUser(userId, data) {
  //   // Firebase/FCM implementation
  // }
}

export default new ComplaintsService();
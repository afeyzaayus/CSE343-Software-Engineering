import Announcement from "../models/Announcement/Announcement.model.js";
import Employee from "../models/Employee/Employee.model.js";

class AnnouncementService {
    constructor() {
        this.announcements = [];
        this.nextId = 1;
    }

    // Announcement Management

    createAnnouncement(title, content, author, category = "general", priority = "normal", date = new Date()) {
        if (!author.canCreateAnnouncement()) {
            throw new Error('User not authorized to create announcements');
        }

        const newAnnouncement = new Announcement(
            this.nextId++,
            title,
            content,
            date,
            category,
            priority,
            author
        );
        
        if (!newAnnouncement.isValid()) {
            throw new Error('Invalid announcement data');
        }
        
        this.announcements.push(newAnnouncement);
        return newAnnouncement;
    }

    findAnnouncementById(id) {
        return this.announcements.find(announcement => announcement.id === id);
    }

    updateAnnouncement(id, title, content, author) {
        const announcement = this.findAnnouncementById(id);
        if (announcement && author.canEditAnnouncement(announcement)) {
            announcement.updateContent(title, content);
            return announcement;
        }
        return null;
    }

    deleteAnnouncement(id, author) {
        const announcement = this.findAnnouncementById(id);
        if (announcement && author.canDeleteAnnouncement()) {
            const index = this.announcements.findIndex(ann => ann.id === id);
            return this.announcements.splice(index, 1)[0];
        }
        return null;
    }

    // Status Management

    toggleAnnouncementStatus(id, author) {
        const announcement = this.findAnnouncementById(id);
        if (announcement && author.canEditAnnouncement(announcement)) {
            announcement.toggleActive();
            return announcement;
        }
        return null;
    }

    deactivateAnnouncement(id, author) {
        const announcement = this.findAnnouncementById(id);
        if (announcement && author.canEditAnnouncement(announcement)) {
            announcement.deactivate();
            return announcement;
        }
        return null;
    }

    activateAnnouncement(id, author) {
        const announcement = this.findAnnouncementById(id);
        if (announcement && author.canEditAnnouncement(announcement)) {
            announcement.activate();
            return announcement;
        }
        return null;
    }

    // View Management

    viewAnnouncement(id) {
        const announcement = this.findAnnouncementById(id);
        if (announcement && announcement.isActive) {
            announcement.incrementViews();
            return announcement;
        }
        return null;
    }

    // Filtering and Search

    getActiveAnnouncements() {
        return this.announcements.filter(announcement => announcement.isActive);
    }

    getUrgentAnnouncements() {
        return this.getActiveAnnouncements().filter(announcement => announcement.isUrgent());
    }

    getHighPriorityAnnouncements() {
        return this.getActiveAnnouncements().filter(announcement => announcement.isHighPriority());
    }

    getRecentAnnouncements(days = 7) {
        return this.getActiveAnnouncements().filter(announcement => 
            announcement.isRecent(days)
        );
    }

    getAnnouncementsByCategory(category) {
        return this.getActiveAnnouncements().filter(announcement => 
            announcement.category === category
        );
    }

    getAnnouncementsByAuthor(authorId) {
        return this.announcements.filter(announcement => 
            announcement.author.id === authorId
        );
    }

    searchAnnouncements(query) {
        const searchTerm = query.toLowerCase();
        return this.getActiveAnnouncements().filter(announcement => 
            announcement.title.toLowerCase().includes(searchTerm) ||
            announcement.content.toLowerCase().includes(searchTerm)
        );
    }

    getHighlightedAnnouncements() {
        return this.getActiveAnnouncements().filter(announcement => 
            announcement.shouldHighlight()
        );
    }

    // Pagination

    getAnnouncementsPaginated(page = 1, pageSize = 10, onlyActive = true) {
        const announcements = onlyActive ? this.getActiveAnnouncements() : this.announcements;
        
        // Sort by date (newest first) and priority
        const sorted = announcements.sort((a, b) => {
            // Urgent announcements first
            if (a.isUrgent() && !b.isUrgent()) return -1;
            if (!a.isUrgent() && b.isUrgent()) return 1;
            
            // Then by date (newest first)
            return new Date(b.date) - new Date(a.date);
        });

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        return {
            announcements: sorted.slice(startIndex, endIndex),
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalItems: sorted.length,
                totalPages: Math.ceil(sorted.length / pageSize),
                hasNext: endIndex < sorted.length,
                hasPrev: page > 1
            }
        };
    }

    // Statistics and Reports

    getAnnouncementStatistics() {
        const totalAnnouncements = this.announcements.length;
        const activeAnnouncements = this.getActiveAnnouncements().length;
        const urgentAnnouncements = this.getUrgentAnnouncements().length;
        const totalViews = this.announcements.reduce((sum, ann) => sum + ann.views, 0);
        
        const categoryStats = {};
        this.announcements.forEach(announcement => {
            categoryStats[announcement.category] = (categoryStats[announcement.category] || 0) + 1;
        });

        const authorStats = {};
        this.announcements.forEach(announcement => {
            const authorName = announcement.author.fullName;
            authorStats[authorName] = (authorStats[authorName] || 0) + 1;
        });

        const recentAnnouncements = this.getRecentAnnouncements(30).length;

        return {
            totalAnnouncements,
            activeAnnouncements,
            urgentAnnouncements,
            recentAnnouncements,
            totalViews,
            averageViews: totalAnnouncements > 0 ? Math.round(totalViews / totalAnnouncements) : 0,
            categoryDistribution: categoryStats,
            authorDistribution: authorStats
        };
    }

    getMostViewedAnnouncements(limit = 5) {
        return this.getActiveAnnouncements()
            .sort((a, b) => b.views - a.views)
            .slice(0, limit);
    }

    getAuthorStatistics(authorId) {
        const authorAnnouncements = this.getAnnouncementsByAuthor(authorId);
        const totalViews = authorAnnouncements.reduce((sum, ann) => sum + ann.views, 0);
        
        return {
            totalAnnouncements: authorAnnouncements.length,
            activeAnnouncements: authorAnnouncements.filter(ann => ann.isActive).length,
            totalViews,
            averageViews: authorAnnouncements.length > 0 ? Math.round(totalViews / authorAnnouncements.length) : 0,
            mostViewed: authorAnnouncements.sort((a, b) => b.views - a.views)[0]
        };
    }

    // Bulk Operations

    bulkDeactivateOldAnnouncements(daysThreshold = 30) {
        const oldAnnouncements = this.announcements.filter(announcement => 
            announcement.isActive && !announcement.isRecent(daysThreshold)
        );

        oldAnnouncements.forEach(announcement => {
            announcement.deactivate();
        });

        return oldAnnouncements.length;
    }

    bulkUpdatePriority(announcementIds, newPriority, author) {
        const results = [];
        announcementIds.forEach(id => {
            const announcement = this.findAnnouncementById(id);
            if (announcement && author.canEditAnnouncement(announcement)) {
                announcement.priority = newPriority;
                results.push({ id, success: true, announcement });
            } else {
                results.push({ id, success: false, error: 'Not authorized or not found' });
            }
        });
        return results;
    }

    // Export and Data Management

    exportAnnouncements(format = 'json') {
        const announcementsData = this.announcements.map(announcement => 
            announcement.toPlainObject()
        );

        if (format === 'json') {
            return JSON.stringify(announcementsData, null, 2);
        }

        // For other formats (CSV, etc.) you could add additional logic
        return announcementsData;
    }

    getAllAnnouncementsWithDetails() {
        return this.announcements.map(announcement => 
            announcement.getAnnouncementDetails()
        );
    }

    getActiveAnnouncementsWithDetails() {
        return this.getActiveAnnouncements().map(announcement => 
            announcement.getAnnouncementDetails()
        );
    }
}

export default new AnnouncementService();
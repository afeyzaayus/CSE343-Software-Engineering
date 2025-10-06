class Announcement {
    constructor(id, title, content, date, category = "general", priority = "normal", author, isActive = true) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.date = date;
        this.category = category; // "general", "maintenance", "security", "event", "payment"
        this.priority = priority; // "low", "normal", "high", "urgent"
        this.author = author; // Employee object
        this.isActive = isActive;
        this.views = 0;
        this.lastUpdated = date;
    }

    // Business logic methods
    updateContent(newTitle, newContent, updateDate = new Date()) {
        this.title = newTitle;
        this.content = newContent;
        this.lastUpdated = updateDate;
        return this;
    }

    incrementViews() {
        this.views++;
        return this;
    }

    toggleActive() {
        this.isActive = !this.isActive;
        return this;
    }

    deactivate() {
        this.isActive = false;
        return this;
    }

    activate() {
        this.isActive = true;
        return this;
    }

    isUrgent() {
        return this.priority === "urgent";
    }

    isHighPriority() {
        return this.priority === "high" || this.isUrgent();
    }

    isRecent(daysThreshold = 7) {
        const now = new Date();
        const announcementDate = new Date(this.date);
        const diffTime = now - announcementDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= daysThreshold;
    }

    isUpdated() {
        return this.lastUpdated > this.date;
    }

    getDaysSincePublication() {
        const now = new Date();
        const publicationDate = new Date(this.date);
        const diffTime = now - publicationDate;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    shouldHighlight() {
        return this.isActive && (this.isUrgent() || this.isRecent(3));
    }

    getSummary(maxLength = 150) {
        if (this.content.length <= maxLength) {
            return this.content;
        }
        return this.content.substring(0, maxLength) + '...';
    }

    isValid() {
        return this.title && 
               this.title.length > 0 && 
               this.content && 
               this.content.length > 0 && 
               this.date && 
               this.author;
    }

    getAnnouncementDetails() {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            summary: this.getSummary(),
            date: this.date,
            lastUpdated: this.lastUpdated,
            category: this.category,
            priority: this.priority,
            author: this.author.fullName,
            authorRole: this.author.role,
            isActive: this.isActive,
            views: this.views,
            isUrgent: this.isUrgent(),
            isRecent: this.isRecent(),
            shouldHighlight: this.shouldHighlight(),
            daysSincePublication: this.getDaysSincePublication(),
            isUpdated: this.isUpdated()
        };
    }

    // Export for sharing
    toPlainObject() {
        return {
            title: this.title,
            content: this.content,
            date: this.date.toISOString().split('T')[0],
            category: this.category,
            priority: this.priority,
            author: this.author.fullName
        };
    }
}

export default Announcement;
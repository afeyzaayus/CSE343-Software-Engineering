class MaintenanceRequest {
    constructor(id, title, description, date, status = "pending", feedback = "", resident) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.date = date;
        this.status = status; // "pending", "in-progress", "completed", "cancelled"
        this.feedback = feedback;
        this.resident = resident; // Resident object
    }

    // Business logic methods
    updateStatus(newStatus) {
        const validStatuses = ["pending", "in-progress", "completed", "cancelled"];
        if (validStatuses.includes(newStatus)) {
            this.status = newStatus;
            return true;
        }
        return false;
    }

    addFeedback(feedback) {
        this.feedback = feedback;
        if (feedback && this.status === "completed") {
            this.status = "reviewed";
        }
        return this;
    }

    isPending() {
        return this.status === "pending";
    }

    isInProgress() {
        return this.status === "in-progress";
    }

    isCompleted() {
        return this.status === "completed" || this.status === "reviewed";
    }

    isOverdue(thresholdDays = 7) {
        if (this.isCompleted()) return false;
        
        const today = new Date();
        const requestDate = new Date(this.date);
        const diffTime = today - requestDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > thresholdDays;
    }

    canAddFeedback() {
        return this.status === "completed" || this.status === "reviewed";
    }

    getPriority() {
        const urgentKeywords = ["acil", "tehlikeli", "yangın", "su", "elektrik", "güvenlik"];
        const description = this.description.toLowerCase();
        
        if (urgentKeywords.some(keyword => description.includes(keyword))) {
            return "high";
        }
        return this.isOverdue() ? "medium" : "low";
    }

    getDetails() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            date: this.date,
            status: this.status,
            feedback: this.feedback,
            residentName: this.resident.fullName,
            apartment: this.resident.apartment,
            priority: this.getPriority(),
            isOverdue: this.isOverdue(),
            canAddFeedback: this.canAddFeedback()
        };
    }

    isValid() {
        return this.title && 
               this.title.length > 0 && 
               this.description && 
               this.description.length > 0 && 
               this.date && 
               this.resident;
    }
}

export default MaintenanceRequest;
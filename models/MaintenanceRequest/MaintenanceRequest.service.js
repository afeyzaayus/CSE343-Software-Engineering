import MaintenanceRequest from "../maintenanceRequest.model.js";

class MaintenanceRequestService {
    constructor() {
        this.requests = [];
        this.nextId = 1;
        this.overdueThreshold = 7; // days
    }

    // Create new maintenance request
    createRequest(title, description, resident, date = new Date()) {
        const newRequest = new MaintenanceRequest(
            this.nextId++,
            title,
            description,
            date,
            "pending",
            "",
            resident
        );
        
        if (!newRequest.isValid()) {
            throw new Error('Invalid request data');
        }
        
        this.requests.push(newRequest);
        return newRequest;
    }

    // Find request by ID
    findRequestById(id) {
        return this.requests.find(request => request.id === id);
    }

    // Find requests by resident ID
    findRequestsByResident(residentId) {
        return this.requests.filter(request => request.resident.id === residentId);
    }

    // Update request status using class method
    updateRequestStatus(id, newStatus) {
        const request = this.findRequestById(id);
        if (request && request.updateStatus(newStatus)) {
            return request;
        }
        return null;
    }

    // Add feedback to request using class method
    addFeedback(id, feedback) {
        const request = this.findRequestById(id);
        if (request) {
            request.addFeedback(feedback);
            return request;
        }
        return null;
    }

    // Get requests by status
    getRequestsByStatus(status) {
        return this.requests.filter(request => request.status === status);
    }

    // Get pending requests
    getPendingRequests() {
        return this.requests.filter(request => request.isPending());
    }

    // Get in-progress requests
    getInProgressRequests() {
        return this.requests.filter(request => request.isInProgress());
    }

    // Get completed requests
    getCompletedRequests() {
        return this.requests.filter(request => request.isCompleted());
    }

    // Get overdue requests using class method
    getOverdueRequests() {
        return this.requests.filter(request => request.isOverdue(this.overdueThreshold));
    }

    // Get high priority requests using class method
    getHighPriorityRequests() {
        return this.requests.filter(request => request.getPriority() === "high");
    }

    // Delete request
    deleteRequest(id) {
        const index = this.requests.findIndex(request => request.id === id);
        if (index !== -1) {
            return this.requests.splice(index, 1)[0];
        }
        return null;
    }

    // Get all requests
    getAllRequests() {
        return [...this.requests];
    }

    // Get requests with details
    getRequestsWithDetails() {
        return this.requests.map(request => request.getDetails());
    }

    // Get resident's request summary
    getResidentRequestSummary(residentId) {
        const residentRequests = this.findRequestsByResident(residentId);
        const totalRequests = residentRequests.length;
        const pendingRequests = residentRequests.filter(req => req.isPending()).length;
        const completedRequests = residentRequests.filter(req => req.isCompleted()).length;
        const overdueRequests = residentRequests.filter(req => req.isOverdue()).length;

        return {
            residentId,
            totalRequests,
            pendingRequests,
            completedRequests,
            overdueRequests,
            completionRate: totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0,
            requests: residentRequests.map(req => req.getDetails())
        };
    }

    // Get statistics
    getStatistics() {
        const totalRequests = this.requests.length;
        const pendingRequests = this.getPendingRequests().length;
        const inProgressRequests = this.getInProgressRequests().length;
        const completedRequests = this.getCompletedRequests().length;
        const overdueRequests = this.getOverdueRequests().length;
        const highPriorityRequests = this.getHighPriorityRequests().length;

        return {
            totalRequests,
            pendingRequests,
            inProgressRequests,
            completedRequests,
            overdueRequests,
            highPriorityRequests,
            completionRate: totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0,
            averageResolutionTime: this.calculateAverageResolutionTime()
        };
    }

    // Calculate average resolution time for completed requests
    calculateAverageResolutionTime() {
        const completedRequests = this.getCompletedRequests();
        if (completedRequests.length === 0) return 0;

        const totalDays = completedRequests.reduce((sum, request) => {
            const createdDate = new Date(request.date);
            // Assume completion date is now for calculation
            const completionDate = new Date();
            const diffTime = completionDate - createdDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return sum + diffDays;
        }, 0);

        return totalDays / completedRequests.length;
    }

    // Set overdue threshold
    setOverdueThreshold(days) {
        if (days > 0) {
            this.overdueThreshold = days;
            return true;
        }
        return false;
    }

    // Search requests by keyword
    searchRequests(keyword) {
        const searchTerm = keyword.toLowerCase();
        return this.requests.filter(request => 
            request.title.toLowerCase().includes(searchTerm) ||
            request.description.toLowerCase().includes(searchTerm)
        );
    }

    // Bulk status update
    bulkUpdateStatus(requestIds, newStatus) {
        const results = [];
        requestIds.forEach(id => {
            const result = this.updateRequestStatus(id, newStatus);
            results.push({ id, success: !!result, request: result });
        });
        return results;
    }
}

export default new MaintenanceRequestService();
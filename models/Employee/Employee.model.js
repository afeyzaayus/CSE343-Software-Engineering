class Employee {
    constructor(id, fullName, email, password, role = "staff", assignedSite) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role; // "admin", "manager", "staff"
        this.assignedSite = assignedSite; // Site object
        this.createdAt = new Date();
        this.isActive = true;
    }

    canCreateAnnouncement() {
        return this.role === "admin" || this.role === "manager";
    }

    canEditAnnouncement(announcement) {
        if (this.role === "admin") return true;
        if (this.role === "manager") return announcement.author.id === this.id;
        return false;
    }

    canDeleteAnnouncement() {
        return this.role === "admin" || this.role === "manager";
    }

    canManageEmployees() {
        return this.role === "admin";
    }

    canAssignToSite() {
        return this.role === "admin" || this.role === "manager";
    }

    getEmployeeInfo() {
        return {
            id: this.id,
            fullName: this.fullName,
            email: this.email,
            role: this.role,
            site: this.assignedSite ? this.assignedSite.name : "Not assigned",
            isActive: this.isActive,
            createdAt: this.createdAt,
            capabilities: {
                canCreateAnnouncement: this.canCreateAnnouncement(),
                canManageEmployees: this.canManageEmployees(),
                canAssignToSite: this.canAssignToSite()
            }
        };
    }

    // For authentication responses (without password)
    toAuthJSON() {
        return {
            id: this.id,
            fullName: this.fullName,
            email: this.email,
            role: this.role,
            site: this.assignedSite ? this.assignedSite.name : null,
            capabilities: {
                canCreateAnnouncement: this.canCreateAnnouncement(),
                canManageEmployees: this.canManageEmployees(),
                canAssignToSite: this.canAssignToSite()
            }
        };
    }
}

export default Employee;
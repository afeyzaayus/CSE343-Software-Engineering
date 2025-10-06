class Site {
    constructor(id, name, securityCode, socialFacilities = [], announcements = [], maintenanceRequests = [], fees = [], apartments = []) {
        this.id = id;
        this.name = name;
        this.securityCode = securityCode;
        this.socialFacilities = socialFacilities; // List of SocialFacility
        this.announcements = announcements; // List of Announcement
        this.maintenanceRequests = maintenanceRequests; // List of MaintenanceRequest
        this.fees = fees; // List of Fee
        this.apartments = apartments; // List of Apartment
        this.createdAt = new Date();
        this.isActive = true;
    }

    // Business logic methods
    calculateTotalFee() {
        return this.fees.reduce((total, fee) => total + fee.amount, 0);
    }

    calculateCollectedFee() {
        return this.fees
            .filter(fee => fee.paymentStatus)
            .reduce((total, fee) => total + fee.amount, 0);
    }

    calculateCollectionRate() {
        const totalFee = this.calculateTotalFee();
        if (totalFee === 0) return 0;
        return (this.calculateCollectedFee() / totalFee) * 100;
    }

    calculatePopulation() {
        return this.apartments.reduce((total, apartment) => 
            total + apartment.residentCount, 0
        );
    }

    getActiveResidentsCount() {
        return this.apartments.reduce((total, apartment) => 
            total + (apartment.resident ? 1 : 0), 0
        );
    }

    getVacantApartments() {
        return this.apartments.filter(apartment => !apartment.resident);
    }

    getVacancyRate() {
        if (this.apartments.length === 0) return 0;
        return (this.getVacantApartments().length / this.apartments.length) * 100;
    }

    getActiveMaintenanceRequests() {
        return this.maintenanceRequests.filter(request => 
            request.status === 'pending' || request.status === 'in-progress'
        );
    }

    getUrgentAnnouncements() {
        return this.announcements.filter(announcement => 
            announcement.isActive && announcement.isUrgent()
        );
    }

    getAvailableSocialFacilities() {
        return this.socialFacilities.filter(facility => facility.isOpen());
    }

    getSocialFacilityByName(name) {
        return this.socialFacilities.find(facility => 
            facility.name.toLowerCase() === name.toLowerCase()
        );
    }

    getResidentByEmail(email) {
        for (let apartment of this.apartments) {
            if (apartment.resident && apartment.resident.email === email) {
                return apartment.resident;
            }
        }
        return null;
    }

    getApartmentByNumber(apartmentNumber) {
        return this.apartments.find(apartment => 
            apartment.number.toLowerCase() === apartmentNumber.toLowerCase()
        );
    }

    isValid() {
        return this.name && 
               this.name.length > 0 && 
               this.securityCode && 
               this.securityCode.length > 0;
    }

    getSiteStatistics() {
        return {
            totalApartments: this.apartments.length,
            occupiedApartments: this.apartments.length - this.getVacantApartments().length,
            vacancyRate: this.getVacancyRate(),
            totalPopulation: this.calculatePopulation(),
            activeResidents: this.getActiveResidentsCount(),
            totalFees: this.calculateTotalFee(),
            collectedFees: this.calculateCollectedFee(),
            collectionRate: this.calculateCollectionRate(),
            activeMaintenanceRequests: this.getActiveMaintenanceRequests().length,
            urgentAnnouncements: this.getUrgentAnnouncements().length,
            socialFacilities: this.socialFacilities.length,
            availableFacilities: this.getAvailableSocialFacilities().length
        };
    }

    getSiteDetails() {
        return {
            id: this.id,
            name: this.name,
            securityCode: this.securityCode,
            createdAt: this.createdAt,
            isActive: this.isActive,
            statistics: this.getSiteStatistics(),
            socialFacilities: this.socialFacilities.map(facility => facility.name),
            announcementsCount: this.announcements.length,
            maintenanceRequestsCount: this.maintenanceRequests.length,
            feesCount: this.fees.length,
            apartmentsCount: this.apartments.length
        };
    }

    // Security and validation
    validateSecurityCode(code) {
        return this.securityCode === code;
    }

    // Capacity management
    getTotalCapacity() {
        return this.apartments.reduce((total, apartment) => 
            total + apartment.capacity, 0
        );
    }

    getOccupancyPercentage() {
        const totalCapacity = this.getTotalCapacity();
        if (totalCapacity === 0) return 0;
        return (this.calculatePopulation() / totalCapacity) * 100;
    }

    // Financial methods
    getMonthlyRevenue(month) {
        const monthlyFees = this.fees.filter(fee => 
            fee.month === month && fee.paymentStatus
        );
        return monthlyFees.reduce((total, fee) => total + fee.amount, 0);
    }

    getOutstandingPayments() {
        return this.fees.filter(fee => !fee.paymentStatus);
    }

    getTotalOutstandingAmount() {
        return this.getOutstandingPayments().reduce((total, fee) => total + fee.amount, 0);
    }
}

export default Site;
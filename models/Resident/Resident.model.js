class Resident {
    constructor(id, fullName, phone, email, apartment, identityNumber = "", emergencyContact = "") {
        this.id = id;
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
        this.apartment = apartment; // Apartment object
        this.identityNumber = identityNumber;
        this.emergencyContact = emergencyContact;
        this.moveInDate = new Date();
        this.isActive = true;
        this.vehicles = []; // List of vehicles
        this.familyMembers = []; // List of family members
    }

    // Business logic methods
    updateContactInfo(phone, email, emergencyContact = "") {
        this.phone = phone;
        this.email = email;
        if (emergencyContact) {
            this.emergencyContact = emergencyContact;
        }
        return this;
    }

    addVehicle(plate, brand, model, color) {
        const vehicle = {
            plate: plate.toUpperCase(),
            brand,
            model,
            color,
            addedDate: new Date()
        };
        this.vehicles.push(vehicle);
        return this;
    }

    removeVehicle(plate) {
        const index = this.vehicles.findIndex(vehicle => 
            vehicle.plate === plate.toUpperCase()
        );
        if (index !== -1) {
            return this.vehicles.splice(index, 1)[0];
        }
        return null;
    }

    addFamilyMember(fullName, relationship, age, identityNumber = "") {
        const familyMember = {
            fullName,
            relationship,
            age,
            identityNumber,
            addedDate: new Date()
        };
        this.familyMembers.push(familyMember);
        return this;
    }

    removeFamilyMember(fullName) {
        const index = this.familyMembers.findIndex(member => 
            member.fullName.toLowerCase() === fullName.toLowerCase()
        );
        if (index !== -1) {
            return this.familyMembers.splice(index, 1)[0];
        }
        return null;
    }

    getTotalFamilyMembers() {
        return this.familyMembers.length + 1; // +1 for the resident themselves
    }

    getVehiclesCount() {
        return this.vehicles.length;
    }

    hasVehicle(plate) {
        return this.vehicles.some(vehicle => 
            vehicle.plate === plate.toUpperCase()
        );
    }

    getVehicle(plate) {
        return this.vehicles.find(vehicle => 
            vehicle.plate === plate.toUpperCase()
        );
    }

    getFamilyMemberByName(fullName) {
        return this.familyMembers.find(member => 
            member.fullName.toLowerCase() === fullName.toLowerCase()
        );
    }

    getResidencyDuration() {
        const now = new Date();
        const moveInDate = new Date(this.moveInDate);
        const diffTime = now - moveInDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffMonths / 12);

        return {
            days: diffDays,
            months: diffMonths,
            years: diffYears,
            formatted: diffYears > 0 ? 
                `${diffYears} yıl ${diffMonths % 12} ay` : 
                `${diffMonths} ay ${diffDays % 30} gün`
        };
    }

    isValid() {
        return this.fullName && 
               this.fullName.length > 0 && 
               this.phone && 
               this.phone.length > 0 && 
               this.email && 
               this.email.length > 0 && 
               this.apartment;
    }

    getResidentDetails() {
        return {
            id: this.id,
            fullName: this.fullName,
            phone: this.phone,
            email: this.email,
            apartment: this.apartment.number,
            block: this.apartment.block,
            identityNumber: this.identityNumber,
            emergencyContact: this.emergencyContact,
            moveInDate: this.moveInDate,
            isActive: this.isActive,
            residencyDuration: this.getResidencyDuration(),
            vehiclesCount: this.getVehiclesCount(),
            familyMembersCount: this.familyMembers.length,
            totalHousehold: this.getTotalFamilyMembers(),
            vehicles: this.vehicles,
            familyMembers: this.familyMembers
        };
    }

    toSimpleObject() {
        return {
            id: this.id,
            fullName: this.fullName,
            phone: this.phone,
            email: this.email,
            apartment: this.apartment.number,
            block: this.apartment.block
        };
    }

    // Notification preferences (could be expanded)
    getNotificationPreferences() {
        return {
            emailNotifications: true,
            smsNotifications: true,
            announcementAlerts: true,
            paymentReminders: true,
            maintenanceUpdates: true
        };
    }

    // Check if resident can receive notifications
    canReceiveEmailNotifications() {
        return this.email && this.isActive;
    }

    canReceiveSmsNotifications() {
        return this.phone && this.isActive;
    }
}

export default Resident;

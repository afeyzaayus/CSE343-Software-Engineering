import Resident from "./Resident.model.js";

class ResidentService {
    constructor() {
        this.residents = [];
        this.nextId = 1;
    }

    // Resident Management

    createResident(fullName, phone, email, apartment, identityNumber = "", emergencyContact = "") {
        // Check if email already exists
        if (this.findResidentByEmail(email)) {
            throw new Error('Resident with this email already exists');
        }

        // Check if apartment is already occupied
        if (this.isApartmentOccupied(apartment)) {
            throw new Error('Apartment is already occupied');
        }

        const newResident = new Resident(
            this.nextId++,
            fullName,
            phone,
            email,
            apartment,
            identityNumber,
            emergencyContact
        );
        
        if (!newResident.isValid()) {
            throw new Error('Invalid resident data');
        }
        
        this.residents.push(newResident);
        return newResident;
    }

    findResidentById(id) {
        return this.residents.find(resident => resident.id === id);
    }

    findResidentByEmail(email) {
        return this.residents.find(resident => 
            resident.email.toLowerCase() === email.toLowerCase()
        );
    }

    findResidentByIdentityNumber(identityNumber) {
        return this.residents.find(resident => 
            resident.identityNumber === identityNumber
        );
    }

    findResidentsByApartment(apartment) {
        return this.residents.filter(resident => 
            resident.apartment.id === apartment.id
        );
    }

    findResidentsByBlock(block) {
        return this.residents.filter(resident => 
            resident.apartment.block.toLowerCase() === block.toLowerCase()
        );
    }

    updateResident(id, updateData) {
        const resident = this.findResidentById(id);
        if (!resident) {
            throw new Error('Resident not found');
        }

        // Check if email is being changed and if it's already taken
        if (updateData.email && updateData.email !== resident.email) {
            const existingResident = this.findResidentByEmail(updateData.email);
            if (existingResident) {
                throw new Error('Email already taken by another resident');
            }
        }

        Object.keys(updateData).forEach(key => {
            if (key !== 'id' && resident.hasOwnProperty(key)) {
                resident[key] = updateData[key];
            }
        });

        return resident;
    }

    deleteResident(id) {
        const resident = this.findResidentById(id);
        if (!resident) {
            throw new Error('Resident not found');
        }

        const index = this.residents.findIndex(res => res.id === id);
        return this.residents.splice(index, 1)[0];
    }

    deactivateResident(id) {
        const resident = this.findResidentById(id);
        if (resident) {
            resident.isActive = false;
            return resident;
        }
        return null;
    }

    activateResident(id) {
        const resident = this.findResidentById(id);
        if (resident) {
            resident.isActive = true;
            return resident;
        }
        return null;
    }

    // Vehicle Management

    addVehicleToResident(residentId, plate, brand, model, color) {
        const resident = this.findResidentById(residentId);
        if (!resident) {
            throw new Error('Resident not found');
        }

        // Check if vehicle plate already exists
        if (this.isVehiclePlateExists(plate)) {
            throw new Error('Vehicle with this plate already exists');
        }

        resident.addVehicle(plate, brand, model, color);
        return resident;
    }

    removeVehicleFromResident(residentId, plate) {
        const resident = this.findResidentById(residentId);
        if (!resident) {
            throw new Error('Resident not found');
        }

        return resident.removeVehicle(plate);
    }

    findResidentByVehiclePlate(plate) {
        return this.residents.find(resident => 
            resident.hasVehicle(plate)
        );
    }

    getVehiclesInBlock(block) {
        const residentsInBlock = this.findResidentsByBlock(block);
        const vehicles = [];
        
        residentsInBlock.forEach(resident => {
            resident.vehicles.forEach(vehicle => {
                vehicles.push({
                    resident: resident.fullName,
                    apartment: resident.apartment.number,
                    ...vehicle
                });
            });
        });

        return vehicles;
    }

    // Family Member Management

    addFamilyMemberToResident(residentId, fullName, relationship, age, identityNumber = "") {
        const resident = this.findResidentById(residentId);
        if (!resident) {
            throw new Error('Resident not found');
        }

        resident.addFamilyMember(fullName, relationship, age, identityNumber);
        return resident;
    }

    removeFamilyMemberFromResident(residentId, fullName) {
        const resident = this.findResidentById(residentId);
        if (!resident) {
            throw new Error('Resident not found');
        }

        return resident.removeFamilyMember(fullName);
    }

    // Filtering and Search

    getActiveResidents() {
        return this.residents.filter(resident => resident.isActive);
    }

    getInactiveResidents() {
        return this.residents.filter(resident => !resident.isActive);
    }

    getResidentsWithVehicles() {
        return this.residents.filter(resident => resident.getVehiclesCount() > 0);
    }

    getResidentsWithFamilyMembers() {
        return this.residents.filter(resident => resident.familyMembers.length > 0);
    }

    getLongTermResidents(minYears = 1) {
        return this.residents.filter(resident => {
            const duration = resident.getResidencyDuration();
            return duration.years >= minYears;
        });
    }

    searchResidents(query) {
        const searchTerm = query.toLowerCase();
        return this.residents.filter(resident => 
            resident.fullName.toLowerCase().includes(searchTerm) ||
            resident.email.toLowerCase().includes(searchTerm) ||
            resident.phone.includes(searchTerm) ||
            resident.apartment.number.toLowerCase().includes(searchTerm) ||
            resident.identityNumber.includes(searchTerm)
        );
    }

    searchResidentsAdvanced(criteria) {
        return this.residents.filter(resident => {
            let matches = true;

            if (criteria.fullName) {
                matches = matches && resident.fullName.toLowerCase().includes(criteria.fullName.toLowerCase());
            }
            if (criteria.email) {
                matches = matches && resident.email.toLowerCase().includes(criteria.email.toLowerCase());
            }
            if (criteria.phone) {
                matches = matches && resident.phone.includes(criteria.phone);
            }
            if (criteria.apartment) {
                matches = matches && resident.apartment.number.toLowerCase().includes(criteria.apartment.toLowerCase());
            }
            if (criteria.block) {
                matches = matches && resident.apartment.block.toLowerCase().includes(criteria.block.toLowerCase());
            }
            if (criteria.hasVehicles !== undefined) {
                matches = matches && (resident.getVehiclesCount() > 0) === criteria.hasVehicles;
            }
            if (critentials.hasFamilyMembers !== undefined) {
                matches = matches && (resident.familyMembers.length > 0) === criteria.hasFamilyMembers;
            }
            if (criteria.isActive !== undefined) {
                matches = matches && resident.isActive === criteria.isActive;
            }

            return matches;
        });
    }

    // Utility Methods

    isApartmentOccupied(apartment) {
        return this.residents.some(resident => 
            resident.apartment.id === apartment.id && resident.isActive
        );
    }

    isVehiclePlateExists(plate) {
        return this.residents.some(resident => 
            resident.hasVehicle(plate)
        );
    }

    getResidentByApartment(apartment) {
        return this.residents.find(resident => 
            resident.apartment.id === apartment.id && resident.isActive
        );
    }

    // Statistics and Reports

    getResidentStatistics() {
        const totalResidents = this.residents.length;
        const activeResidents = this.getActiveResidents().length;
        const residentsWithVehicles = this.getResidentsWithVehicles().length;
        const residentsWithFamily = this.getResidentsWithFamilyMembers().length;
        const longTermResidents = this.getLongTermResidents(1).length;

        const totalVehicles = this.residents.reduce((sum, resident) => 
            sum + resident.getVehiclesCount(), 0
        );

        const totalFamilyMembers = this.residents.reduce((sum, resident) => 
            sum + resident.familyMembers.length, 0
        );

        const totalHousehold = activeResidents + totalFamilyMembers;

        return {
            totalResidents,
            activeResidents,
            inactiveResidents: totalResidents - activeResidents,
            residentsWithVehicles,
            residentsWithFamily,
            longTermResidents,
            totalVehicles,
            totalFamilyMembers,
            totalHousehold,
            averageVehiclesPerResident: activeResidents > 0 ? (totalVehicles / activeResidents).toFixed(2) : 0,
            averageFamilyMembersPerResident: activeResidents > 0 ? (totalFamilyMembers / activeResidents).toFixed(2) : 0
        };
    }

    getBlockStatistics(block) {
        const residentsInBlock = this.findResidentsByBlock(block);
        const activeResidents = residentsInBlock.filter(res => res.isActive);
        
        const totalVehicles = activeResidents.reduce((sum, resident) => 
            sum + resident.getVehiclesCount(), 0
        );

        const totalFamilyMembers = activeResidents.reduce((sum, resident) => 
            sum + resident.familyMembers.length, 0
        );

        return {
            block,
            totalResidents: residentsInBlock.length,
            activeResidents: activeResidents.length,
            totalVehicles,
            totalFamilyMembers,
            totalHousehold: activeResidents.length + totalFamilyMembers
        };
    }

    getResidentDemographics() {
        const ageGroups = {
            '0-17': 0,
            '18-30': 0,
            '31-45': 0,
            '46-60': 0,
            '61+': 0
        };

        // This would require age data in resident or family members
        // For now, we'll use residency duration as a proxy
        const residencyGroups = {
            '0-1 year': 0,
            '1-3 years': 0,
            '3-5 years': 0,
            '5+ years': 0
        };

        this.getActiveResidents().forEach(resident => {
            const duration = resident.getResidencyDuration();
            
            if (duration.years < 1) residencyGroups['0-1 year']++;
            else if (duration.years < 3) residencyGroups['1-3 years']++;
            else if (duration.years < 5) residencyGroups['3-5 years']++;
            else residencyGroups['5+ years']++;
        });

        return {
            residencyGroups,
            totalActive: this.getActiveResidents().length
        };
    }

    // Bulk Operations

    bulkUpdateResidentStatus(residentIds, isActive) {
        const results = [];
        residentIds.forEach(residentId => {
            try {
                const resident = isActive ? 
                    this.activateResident(residentId) : 
                    this.deactivateResident(residentId);
                results.push({ residentId, success: !!resident, resident });
            } catch (error) {
                results.push({ residentId, success: false, error: error.message });
            }
        });
        return results;
    }

    bulkAddVehicles(residentId, vehicles) {
        const resident = this.findResidentById(residentId);
        if (!resident) {
            throw new Error('Resident not found');
        }

        const results = [];
        vehicles.forEach(vehicle => {
            try {
                resident.addVehicle(vehicle.plate, vehicle.brand, vehicle.model, vehicle.color);
                results.push({ plate: vehicle.plate, success: true });
            } catch (error) {
                results.push({ plate: vehicle.plate, success: false, error: error.message });
            }
        });

        return results;
    }

    // Data Export

    exportResidentsData(format = 'json') {
        const residentsData = this.residents.map(resident => 
            resident.getResidentDetails()
        );

        if (format === 'json') {
            return JSON.stringify(residentsData, null, 2);
        }

        return residentsData;
    }

    getAllResidentsWithDetails() {
        return this.residents.map(resident => resident.getResidentDetails());
    }

    getActiveResidentsWithDetails() {
        return this.getActiveResidents().map(resident => resident.getResidentDetails());
    }

    // Validation and Utilities

    validateResidentData(residentData) {
        const requiredFields = ['fullName', 'phone', 'email', 'apartment'];
        const missingFields = requiredFields.filter(field => !residentData[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        if (residentData.email && !this.isValidEmail(residentData.email)) {
            throw new Error('Invalid email format');
        }

        if (residentData.phone && !this.isValidPhone(residentData.phone)) {
            throw new Error('Invalid phone format');
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        // Basic phone validation - can be enhanced based on requirements
        const phoneRegex = /^[0-9+\-\s()]{10,}$/;
        return phoneRegex.test(phone);
    }

    // Notification Management
    getResidentsForNotification(type) {
        return this.getActiveResidents().filter(resident => {
            const preferences = resident.getNotificationPreferences();
            switch (type) {
                case 'email':
                    return resident.canReceiveEmailNotifications() && preferences.emailNotifications;
                case 'sms':
                    return resident.canReceiveSmsNotifications() && preferences.smsNotifications;
                case 'announcement':
                    return preferences.announcementAlerts;
                case 'payment':
                    return preferences.paymentReminders;
                case 'maintenance':
                    return preferences.maintenanceUpdates;
                default:
                    return false;
            }
        });
    }
}

export default new ResidentService();
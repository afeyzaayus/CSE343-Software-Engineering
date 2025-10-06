import Apartment from "./Apartment.model.js";

class ApartmentService {
    constructor() {
        this.apartments = [];
        this.nextId = 1;
    }

    // Apartment Management

    createApartment(number, block, floor, capacity = 4) {
        // Check if apartment number already exists in the same block
        if (this.findApartmentByNumber(number, block)) {
            throw new Error('Apartment number already exists in this block');
        }

        const newApartment = new Apartment(
            this.nextId++,
            number,
            block,
            floor,
            null,
            0,
            capacity,
            ""
        );
        
        if (!newApartment.isValid()) {
            throw new Error('Invalid apartment data');
        }
        
        this.apartments.push(newApartment);
        return newApartment;
    }

    findApartmentById(id) {
        return this.apartments.find(apartment => apartment.id === id);
    }

    findApartmentByNumber(number, block = null) {
        return this.apartments.find(apartment => {
            const numberMatch = apartment.number.toLowerCase() === number.toLowerCase();
            if (block) {
                return numberMatch && apartment.block.toLowerCase() === block.toLowerCase();
            }
            return numberMatch;
        });
    }

    findApartmentsByBlock(block) {
        return this.apartments.filter(apartment => 
            apartment.block.toLowerCase() === block.toLowerCase()
        );
    }

    findApartmentsByFloor(block, floor) {
        return this.apartments.filter(apartment => 
            apartment.block.toLowerCase() === block.toLowerCase() &&
            apartment.floor === floor
        );
    }

    updateApartment(id, updateData) {
        const apartment = this.findApartmentById(id);
        if (!apartment) {
            throw new Error('Apartment not found');
        }

        // Check if number is being changed and if it conflicts with existing
        if (updateData.number && updateData.number !== apartment.number) {
            const existingApartment = this.findApartmentByNumber(updateData.number, apartment.block);
            if (existingApartment) {
                throw new Error('Apartment number already exists in this block');
            }
        }

        Object.keys(updateData).forEach(key => {
            if (key !== 'id' && apartment.hasOwnProperty(key)) {
                apartment[key] = updateData[key];
            }
        });

        return apartment;
    }

    deleteApartment(id) {
        const apartment = this.findApartmentById(id);
        if (!apartment) {
            throw new Error('Apartment not found');
        }

        if (apartment.isOccupied) {
            throw new Error('Cannot delete occupied apartment');
        }

        const index = this.apartments.findIndex(apt => apt.id === id);
        return this.apartments.splice(index, 1)[0];
    }

    // Resident Management

    assignResident(apartmentId, resident) {
        const apartment = this.findApartmentById(apartmentId);
        if (!apartment) {
            throw new Error('Apartment not found');
        }

        if (apartment.isOccupied) {
            throw new Error('Apartment is already occupied');
        }

        apartment.assignResident(resident);
        return apartment;
    }

    removeResident(apartmentId) {
        const apartment = this.findApartmentById(apartmentId);
        if (!apartment) {
            throw new Error('Apartment not found');
        }

        apartment.removeResident();
        return apartment;
    }

    updateResidentCount(apartmentId, count) {
        const apartment = this.findApartmentById(apartmentId);
        if (!apartment) {
            throw new Error('Apartment not found');
        }

        if (!apartment.updateResidentCount(count)) {
            throw new Error('Resident count exceeds apartment capacity');
        }

        return apartment;
    }

    updateLicensePlate(apartmentId, plate) {
        const apartment = this.findApartmentById(apartmentId);
        if (!apartment) {
            throw new Error('Apartment not found');
        }

        apartment.updateLicensePlate(plate);
        return apartment;
    }

    // Filtering and Search

    getOccupiedApartments() {
        return this.apartments.filter(apartment => apartment.isOccupied);
    }

    getVacantApartments() {
        return this.apartments.filter(apartment => !apartment.isOccupied);
    }

    getFullApartments() {
        return this.apartments.filter(apartment => apartment.isFull());
    }

    getApartmentsWithAvailableSpace() {
        return this.apartments.filter(apartment => 
            apartment.isOccupied && !apartment.isFull()
        );
    }

    searchApartments(query) {
        const searchTerm = query.toLowerCase();
        return this.apartments.filter(apartment => 
            apartment.number.toLowerCase().includes(searchTerm) ||
            apartment.block.toLowerCase().includes(searchTerm) ||
            (apartment.resident && apartment.resident.fullName.toLowerCase().includes(searchTerm)) ||
            apartment.licensePlate.toLowerCase().includes(searchTerm)
        );
    }

    getApartmentsByResidentCount(minCount = 0, maxCount = Infinity) {
        return this.apartments.filter(apartment => 
            apartment.residentCount >= minCount && apartment.residentCount <= maxCount
        );
    }

    // Statistics and Reports

    getApartmentStatistics() {
        const totalApartments = this.apartments.length;
        const occupiedApartments = this.getOccupiedApartments().length;
        const vacantApartments = totalApartments - occupiedApartments;
        const fullApartments = this.getFullApartments().length;

        const totalCapacity = this.apartments.reduce((sum, apartment) => 
            sum + apartment.capacity, 0
        );

        const totalResidents = this.apartments.reduce((sum, apartment) => 
            sum + apartment.residentCount, 0
        );

        const occupancyRate = totalApartments > 0 ? (occupiedApartments / totalApartments) * 100 : 0;
        const capacityUtilization = totalCapacity > 0 ? (totalResidents / totalCapacity) * 100 : 0;

        // Block statistics
        const blockStats = {};
        this.apartments.forEach(apartment => {
            if (!blockStats[apartment.block]) {
                blockStats[apartment.block] = {
                    total: 0,
                    occupied: 0,
                    vacant: 0,
                    totalResidents: 0,
                    totalCapacity: 0
                };
            }
            
            blockStats[apartment.block].total++;
            blockStats[apartment.block].totalCapacity += apartment.capacity;
            blockStats[apartment.block].totalResidents += apartment.residentCount;
            
            if (apartment.isOccupied) {
                blockStats[apartment.block].occupied++;
            } else {
                blockStats[apartment.block].vacant++;
            }
        });

        return {
            totalApartments,
            occupiedApartments,
            vacantApartments,
            fullApartments,
            totalCapacity,
            totalResidents,
            occupancyRate: Math.round(occupancyRate * 100) / 100,
            capacityUtilization: Math.round(capacityUtilization * 100) / 100,
            averageResidentsPerApartment: totalApartments > 0 ? (totalResidents / totalApartments).toFixed(2) : 0,
            blockStats
        };
    }

    getBlockStatistics(block) {
        const blockApartments = this.findApartmentsByBlock(block);
        const occupied = blockApartments.filter(apt => apt.isOccupied).length;
        const totalResidents = blockApartments.reduce((sum, apt) => sum + apt.residentCount, 0);
        const totalCapacity = blockApartments.reduce((sum, apt) => sum + apt.capacity, 0);

        return {
            block,
            totalApartments: blockApartments.length,
            occupiedApartments: occupied,
            vacantApartments: blockApartments.length - occupied,
            totalResidents,
            totalCapacity,
            occupancyRate: blockApartments.length > 0 ? (occupied / blockApartments.length) * 100 : 0,
            capacityUtilization: totalCapacity > 0 ? (totalResidents / totalCapacity) * 100 : 0
        };
    }

    getFloorStatistics(block, floor) {
        const floorApartments = this.findApartmentsByFloor(block, floor);
        const occupied = floorApartments.filter(apt => apt.isOccupied).length;

        return {
            block,
            floor,
            totalApartments: floorApartments.length,
            occupiedApartments: occupied,
            vacantApartments: floorApartments.length - occupied,
            occupancyRate: floorApartments.length > 0 ? (occupied / floorApartments.length) * 100 : 0
        };
    }

    // Bulk Operations

    bulkCreateApartments(apartmentsData) {
        const results = [];
        apartmentsData.forEach(aptData => {
            try {
                const apartment = this.createApartment(
                    aptData.number,
                    aptData.block,
                    aptData.floor,
                    aptData.capacity
                );
                results.push({ apartment: aptData.number, success: true, data: apartment });
            } catch (error) {
                results.push({ apartment: aptData.number, success: false, error: error.message });
            }
        });

        return results;
    }

    bulkAssignResidents(assignments) {
        const results = [];
        assignments.forEach(assignment => {
            try {
                const apartment = this.assignResident(assignment.apartmentId, assignment.resident);
                results.push({ 
                    apartmentId: assignment.apartmentId, 
                    success: true, 
                    apartment: apartment.getApartmentDetails() 
                });
            } catch (error) {
                results.push({ 
                    apartmentId: assignment.apartmentId, 
                    success: false, 
                    error: error.message 
                });
            }
        });

        return results;
    }

    // Data Export

    exportApartmentsData(format = 'json') {
        const apartmentsData = this.apartments.map(apartment => 
            apartment.getApartmentDetails()
        );

        if (format === 'json') {
            return JSON.stringify(apartmentsData, null, 2);
        }

        return apartmentsData;
    }

    getAllApartmentsWithDetails() {
        return this.apartments.map(apartment => apartment.getApartmentDetails());
    }

    getVacantApartmentsWithDetails() {
        return this.getVacantApartments().map(apartment => apartment.getApartmentDetails());
    }

    getOccupiedApartmentsWithDetails() {
        return this.getOccupiedApartments().map(apartment => apartment.getApartmentDetails());
    }

    // Validation and Utilities

    validateApartmentData(apartmentData) {
        const requiredFields = ['number', 'block', 'floor'];
        const missingFields = requiredFields.filter(field => !apartmentData[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        if (apartmentData.capacity && apartmentData.capacity <= 0) {
            throw new Error('Capacity must be greater than 0');
        }

        if (apartmentData.floor && apartmentData.floor <= 0) {
            throw new Error('Floor must be greater than 0');
        }

        return true;
    }

    // Capacity Planning
    getAvailableCapacity() {
        return this.apartments.reduce((sum, apartment) => 
            sum + apartment.getAvailableSpace(), 0
        );
    }

    canAccommodateMoreResidents() {
        return this.getAvailableCapacity() > 0;
    }

    // Find apartments that can accommodate specific number of people
    findApartmentsForGroup(groupSize) {
        return this.getVacantApartments().filter(apartment => 
            apartment.capacity >= groupSize
        );
    }
}

export default new ApartmentService();
import SocialFacility from "../models/SocialFacility.model.js";
import Reservation from "../models/Reservation.model.js";

class SocialFacilityService {
    constructor() {
        this.facilities = [];
        this.reservations = [];
        this.nextFacilityId = 1;
        this.nextReservationId = 1;
    }

    // Facility Management

    createFacility(name, openingTime, closingTime, rules, capacity, reservationFee = 0) {
        const newFacility = new SocialFacility(
            this.nextFacilityId++,
            name,
            openingTime,
            closingTime,
            rules,
            capacity,
            reservationFee
        );
        
        if (!newFacility.isValid()) {
            throw new Error('Invalid facility data');
        }
        
        this.facilities.push(newFacility);
        return newFacility;
    }

    findFacilityById(id) {
        return this.facilities.find(facility => facility.id === id);
    }

    findFacilityByName(name) {
        return this.facilities.find(facility => 
            facility.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    getOpenFacilities() {
        return this.facilities.filter(facility => facility.isOpen());
    }

    getFacilitiesByCapacity(minCapacity) {
        return this.facilities.filter(facility => facility.capacity >= minCapacity);
    }

    // Reservation Management

    makeReservation(facilityId, resident, date, timeSlot, numberOfPeople = 1) {
        const facility = this.findFacilityById(facilityId);
        if (!facility) {
            throw new Error('Facility not found');
        }

        if (!facility.canMakeReservation(date, timeSlot, numberOfPeople)) {
            throw new Error('Reservation not available for the selected time slot');
        }

        const newReservation = new Reservation(
            this.nextReservationId++,
            facility,
            resident,
            date,
            timeSlot,
            numberOfPeople
        );

        if (!newReservation.isValid()) {
            throw new Error('Invalid reservation data');
        }

        // Add reservation to facility
        facility.addReservation(newReservation);
        this.reservations.push(newReservation);

        return newReservation;
    }

    cancelReservation(reservationId) {
        const reservation = this.reservations.find(res => res.id === reservationId);
        if (reservation && reservation.cancel()) {
            // Also update facility reservations
            const facility = reservation.facility;
            facility.cancelReservation(reservationId);
            return reservation;
        }
        return null;
    }

    findReservationById(id) {
        return this.reservations.find(reservation => reservation.id === id);
    }

    findReservationsByResident(residentId) {
        return this.reservations.filter(reservation => 
            reservation.resident.id === residentId
        );
    }

    findReservationsByFacility(facilityId) {
        return this.reservations.filter(reservation => 
            reservation.facility.id === facilityId
        );
    }

    getUpcomingReservations() {
        return this.reservations.filter(reservation => reservation.isUpcoming());
    }

    getPastReservations() {
        return this.reservations.filter(reservation => reservation.isPast());
    }

    // Availability and Scheduling

    checkAvailability(facilityId, date, timeSlot) {
        const facility = this.findFacilityById(facilityId);
        if (!facility) return null;

        return {
            available: facility.canMakeReservation(date, timeSlot),
            availableSlots: facility.getAvailableSlots(date),
            facility: facility.getFacilityDetails()
        };
    }

    getAvailableTimeSlots(facilityId, date) {
        const facility = this.findFacilityById(facilityId);
        return facility ? facility.getAvailableSlots(date) : [];
    }

    // Reports and Statistics

    getFacilityUtilization(facilityId, startDate, endDate) {
        const facility = this.findFacilityById(facilityId);
        if (!facility) return null;

        const utilizationData = [];
        const currentDate = new Date(startDate);
        const end = new Date(endDate);

        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            utilizationData.push({
                date: dateStr,
                occupancyRate: facility.getOccupancyRate(dateStr),
                totalReservations: facility.getBookedSlotsForDate(dateStr).length
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return utilizationData;
    }

    getResidentReservationSummary(residentId) {
        const residentReservations = this.findReservationsByResident(residentId);
        const totalReservations = residentReservations.length;
        const upcomingReservations = residentReservations.filter(res => res.isUpcoming()).length;
        const pastReservations = residentReservations.filter(res => res.isPast()).length;
        const totalSpent = residentReservations
            .filter(res => res.status === 'completed')
            .reduce((sum, res) => sum + res.totalFee, 0);

        return {
            residentId,
            totalReservations,
            upcomingReservations,
            pastReservations,
            totalSpent,
            favoriteFacility: this.getFavoriteFacility(residentId),
            reservations: residentReservations.map(res => res.getReservationDetails())
        };
    }

    getFavoriteFacility(residentId) {
        const residentReservations = this.findReservationsByResident(residentId);
        const facilityCount = {};
        
        residentReservations.forEach(reservation => {
            const facilityId = reservation.facility.id;
            facilityCount[facilityId] = (facilityCount[facilityId] || 0) + 1;
        });

        const mostUsed = Object.entries(facilityCount).sort((a, b) => b[1] - a[1])[0];
        return mostUsed ? this.findFacilityById(parseInt(mostUsed[0])) : null;
    }

    getOverallStatistics() {
        const totalFacilities = this.facilities.length;
        const totalReservations = this.reservations.length;
        const activeReservations = this.getUpcomingReservations().length;
        const totalRevenue = this.reservations
            .filter(res => res.status === 'completed')
            .reduce((sum, res) => sum + res.totalFee, 0);

        const facilityStats = this.facilities.map(facility => ({
            name: facility.name,
            occupancyRate: facility.getOccupancyRate(new Date()),
            totalBookings: facility.reservations.filter(r => r.status !== 'cancelled').length,
            revenue: facility.reservations
                .filter(r => r.status === 'completed')
                .reduce((sum, res) => sum + res.totalFee, 0)
        }));

        return {
            totalFacilities,
            totalReservations,
            activeReservations,
            totalRevenue,
            averageOccupancy: facilityStats.reduce((sum, stat) => sum + stat.occupancyRate, 0) / totalFacilities,
            facilityStats
        };
    }

    // Maintenance and Management

    getFacilitiesNeedingMaintenance(usageThreshold = 100) {
        return this.facilities.filter(facility => 
            facility.needsMaintenance(usageThreshold)
        );
    }

    updateFacilityHours(facilityId, openingTime, closingTime) {
        const facility = this.findFacilityById(facilityId);
        if (facility) {
            facility.openingTime = openingTime;
            facility.closingTime = closingTime;
            return facility;
        }
        return null;
    }

    // Search and Filter

    searchFacilities(query) {
        const searchTerm = query.toLowerCase();
        return this.facilities.filter(facility => 
            facility.name.toLowerCase().includes(searchTerm) ||
            facility.rules.toLowerCase().includes(searchTerm)
        );
    }

    getFacilitiesWithDetails() {
        return this.facilities.map(facility => facility.getFacilityDetails());
    }
}

export default new SocialFacilityService();
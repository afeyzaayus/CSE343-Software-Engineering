class SocialFacility {
    constructor(id, name, openingTime, closingTime, rules, capacity, reservationFee = 0) {
        this.id = id;
        this.name = name;
        this.openingTime = openingTime;
        this.closingTime = closingTime;
        this.rules = rules;
        this.capacity = capacity;
        this.reservationFee = reservationFee;
        this.reservations = []; // List of Reservation objects
    }

    // Business logic methods
    isOpen(currentTime = new Date()) {
        const currentHour = currentTime.getHours();
        const currentMinutes = currentTime.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinutes;

        const [openHour, openMinute] = this.openingTime.split(':').map(Number);
        const [closeHour, closeMinute] = this.closingTime.split(':').map(Number);

        const openTimeInMinutes = openHour * 60 + openMinute;
        const closeTimeInMinutes = closeHour * 60 + closeMinute;

        return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes;
    }

    getAvailableSlots(date) {
        const bookedSlots = this.getBookedSlotsForDate(date);
        const availableSlots = [];
        
        // Generate time slots from opening to closing time
        const [openHour, openMinute] = this.openingTime.split(':').map(Number);
        const [closeHour, closeMinute] = this.closingTime.split(':').map(Number);

        let currentHour = openHour;
        let currentMinute = openMinute;

        while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
            const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            
            // Check if slot is available (not booked and within capacity)
            const slotBookings = bookedSlots.filter(booking => booking.timeSlot === timeSlot);
            if (slotBookings.length < this.capacity) {
                availableSlots.push({
                    timeSlot,
                    availableSpots: this.capacity - slotBookings.length
                });
            }

            // Increment time by 30 minutes
            currentMinute += 30;
            if (currentMinute >= 60) {
                currentHour += 1;
                currentMinute = 0;
            }
        }

        return availableSlots;
    }

    getBookedSlotsForDate(date) {
        const targetDate = new Date(date).toDateString();
        return this.reservations.filter(reservation => 
            new Date(reservation.date).toDateString() === targetDate && 
            reservation.status !== 'cancelled'
        );
    }

    canMakeReservation(date, timeSlot, numberOfPeople = 1) {
        if (!this.isOpen()) return false;

        const bookedSlots = this.getBookedSlotsForDate(date);
        const slotBookings = bookedSlots.filter(booking => booking.timeSlot === timeSlot);
        
        return (slotBookings.length + numberOfPeople) <= this.capacity;
    }

    addReservation(reservation) {
        if (this.canMakeReservation(reservation.date, reservation.timeSlot, reservation.numberOfPeople)) {
            this.reservations.push(reservation);
            return true;
        }
        return false;
    }

    cancelReservation(reservationId) {
        const reservation = this.reservations.find(res => res.id === reservationId);
        if (reservation) {
            reservation.status = 'cancelled';
            return true;
        }
        return false;
    }

    getOccupancyRate(date) {
        const bookedSlots = this.getBookedSlotsForDate(date);
        const totalPossibleSlots = this.capacity * this.getTotalTimeSlots();
        
        if (totalPossibleSlots === 0) return 0;
        
        const totalBooked = bookedSlots.reduce((sum, booking) => sum + booking.numberOfPeople, 0);
        return (totalBooked / totalPossibleSlots) * 100;
    }

    getTotalTimeSlots() {
        const [openHour, openMinute] = this.openingTime.split(':').map(Number);
        const [closeHour, closeMinute] = this.closingTime.split(':').map(Number);

        const openInMinutes = openHour * 60 + openMinute;
        const closeInMinutes = closeHour * 60 + closeMinute;
        
        return Math.floor((closeInMinutes - openInMinutes) / 30);
    }

    getFacilityDetails() {
        return {
            id: this.id,
            name: this.name,
            openingTime: this.openingTime,
            closingTime: this.closingTime,
            rules: this.rules,
            capacity: this.capacity,
            reservationFee: this.reservationFee,
            isOpen: this.isOpen(),
            totalReservations: this.reservations.filter(r => r.status !== 'cancelled').length,
            todayOccupancy: this.getOccupancyRate(new Date())
        };
    }

    isValid() {
        return this.name && 
               this.name.length > 0 && 
               this.openingTime && 
               this.closingTime && 
               this.capacity > 0;
    }

    // Maintenance related methods
    needsMaintenance(usageThreshold = 100) {
        const activeReservations = this.reservations.filter(r => r.status !== 'cancelled');
        return activeReservations.length >= usageThreshold;
    }

    getMaintenanceSchedule() {
        const today = new Date();
        const maintenanceDates = [];
        
        // Schedule maintenance every 3 months
        for (let i = 0; i < 4; i++) {
            const nextDate = new Date(today);
            nextDate.setMonth(today.getMonth() + (i * 3));
            maintenanceDates.push(nextDate);
        }
        
        return maintenanceDates;
    }
}

export default SocialFacility;
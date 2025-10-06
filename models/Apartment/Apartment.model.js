class Apartment {
    constructor(id, number, block, floor, resident = null, residentCount = 0, capacity = 4, licensePlate = "") {
        this.id = id;
        this.number = number;
        this.block = block;
        this.floor = floor;
        this.resident = resident; // Resident object
        this.residentCount = residentCount;
        this.capacity = capacity;
        this.licensePlate = licensePlate;
        this.isOccupied = !!resident;
    }

    assignResident(resident) {
        this.resident = resident;
        this.isOccupied = true;
        this.residentCount = 1;
        return this;
    }

    removeResident() {
        this.resident = null;
        this.isOccupied = false;
        this.residentCount = 0;
        return this;
    }

    updateResidentCount(count) {
        if (count <= this.capacity) {
            this.residentCount = count;
            return true;
        }
        return false;
    }

    updateLicensePlate(plate) {
        this.licensePlate = plate;
        return this;
    }

    isFull() {
        return this.residentCount >= this.capacity;
    }

    getAvailableSpace() {
        return this.capacity - this.residentCount;
    }

    getApartmentDetails() {
        return {
            id: this.id,
            number: this.number,
            block: this.block,
            floor: this.floor,
            isOccupied: this.isOccupied,
            resident: this.resident ? this.resident.fullName : null,
            residentCount: this.residentCount,
            capacity: this.capacity,
            licensePlate: this.licensePlate,
            isFull: this.isFull(),
            availableSpace: this.getAvailableSpace()
        };
    }

    isValid() {
        return this.number && this.number.length > 0 && this.block && this.block.length > 0;
    }
}

export default Apartment;
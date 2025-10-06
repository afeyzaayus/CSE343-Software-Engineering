// aidat için temel class
// data + temel işler

class Fee {
    constructor(id, month, amount, paymentStatus = false, delayDays = 0, resident) {
        this.id = id;
        this.month = month;
        this.amount = amount;
        this.paymentStatus = paymentStatus;
        this.delayDays = delayDays;
        this.resident = resident;
    }

    updatePayment(paymentStatus, delayDays = 0) {
        this.paymentStatus = paymentStatus;
        this.delayDays = delayDays;
        return this;
    }

    // Business logic methods
    isOverdue() {
        return !this.paymentStatus && this.delayDays > 0;
    }

    calculatePenalty(penaltyRate = 0.05) {
        return this.isOverdue() ? this.amount * penaltyRate * this.delayDays : 0;
    }

    getTotalAmount(penaltyRate = 0.05) {
        return this.amount + this.calculatePenalty(penaltyRate);
    }

    markAsPaid() {
        this.paymentStatus = true;
        this.delayDays = 0;
        return this;
    }

    // Validation methods
    isValid() {
        return this.amount > 0 && 
               this.month && 
               this.month.length > 0 && 
               this.resident;
    }

    // Utility methods
    getStatus() {
        if (this.paymentStatus) return 'paid';
        if (this.delayDays > 0) return 'overdue';
        return 'pending';
    }

    getDetails() {
        return {
            id: this.id,
            month: this.month,
            amount: this.amount,
            paymentStatus: this.paymentStatus,
            delayDays: this.delayDays,
            residentName: this.resident.fullName,
            status: this.getStatus(),
            penalty: this.calculatePenalty(),
            totalAmount: this.getTotalAmount()
        };
    }
}

export default Fee;
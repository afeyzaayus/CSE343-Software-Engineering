import Fee from "../models/Fee.model.js";

class FeeService {
    constructor() {
        this.fees = [];
        this.nextId = 1;
        this.penaltyRate = 0.05; // Default penalty rate %5
    }

    // Create new fee using Fee class
    createFee(month, amount, resident, paymentStatus = false, delayDays = 0) {
        const newFee = new Fee(
            this.nextId++,
            month,
            amount,
            paymentStatus,
            delayDays,
            resident
        );
        
        if (!newFee.isValid()) {
            throw new Error('Invalid fee data');
        }
        
        this.fees.push(newFee);
        return newFee;
    }

    // Find fee by ID
    findFeeById(id) {
        return this.fees.find(fee => fee.id === id);
    }

    // Find fees by resident ID
    findFeesByResident(residentId) {
        return this.fees.filter(fee => fee.resident.id === residentId);
    }

    // Update payment status using Fee class method
    updatePaymentStatus(id, paymentStatus, delayDays = 0) {
        const fee = this.findFeeById(id);
        if (fee) {
            fee.updatePayment(paymentStatus, delayDays);
            return fee;
        }
        return null;
    }

    // Pay fee using Fee class method
    payFee(id) {
        const fee = this.findFeeById(id);
        if (fee) {
            return fee.markAsPaid();
        }
        return null;
    }

    // Find fees by month
    findFeesByMonth(month) {
        return this.fees.filter(fee => fee.month === month);
    }

    // Get unpaid fees using Fee class method
    getUnpaidFees() {
        return this.fees.filter(fee => !fee.paymentStatus);
    }

    // Get overdue fees using Fee class method
    getOverdueFees() {
        return this.fees.filter(fee => fee.isOverdue());
    }

    // Delete fee
    deleteFee(id) {
        const index = this.fees.findIndex(fee => fee.id === id);
        if (index !== -1) {
            return this.fees.splice(index, 1)[0];
        }
        return null;
    }

    // Get all fees
    getAllFees() {
        return [...this.fees];
    }

    // Calculate total expected fee amount
    calculateTotalExpectedFee() {
        return this.fees.reduce((total, fee) => total + fee.amount, 0);
    }

    // Calculate total collected fee amount
    calculateTotalCollectedFee() {
        return this.fees
            .filter(fee => fee.paymentStatus)
            .reduce((total, fee) => total + fee.amount, 0);
    }

    // Calculate total with penalties
    calculateTotalWithPenalties() {
        return this.fees.reduce((total, fee) => total + fee.getTotalAmount(this.penaltyRate), 0);
    }

    // Calculate collection rate
    calculateCollectionRate() {
        const totalExpected = this.calculateTotalExpectedFee();
        if (totalExpected === 0) return 0;
        
        const totalCollected = this.calculateTotalCollectedFee();
        return (totalCollected / totalExpected) * 100;
    }

    // Get fees with detailed information
    getFeesWithDetails() {
        return this.fees.map(fee => fee.getDetails());
    }

    // Get resident's fee summary
    getResidentFeeSummary(residentId) {
        const residentFees = this.findFeesByResident(residentId);
        const totalAmount = residentFees.reduce((sum, fee) => sum + fee.amount, 0);
        const paidAmount = residentFees
            .filter(fee => fee.paymentStatus)
            .reduce((sum, fee) => sum + fee.amount, 0);
        const overdueFees = residentFees.filter(fee => fee.isOverdue());
        
        return {
            residentId,
            totalFees: residentFees.length,
            totalAmount,
            paidAmount,
            pendingAmount: totalAmount - paidAmount,
            overdueFees: overdueFees.length,
            fees: residentFees.map(fee => fee.getDetails())
        };
    }

    // Update penalty rate
    setPenaltyRate(rate) {
        if (rate >= 0) {
            this.penaltyRate = rate;
            return true;
        }
        return false;
    }

    // Get statistics
    getStatistics() {
        const totalFees = this.fees.length;
        const paidFees = this.fees.filter(fee => fee.paymentStatus).length;
        const overdueFees = this.getOverdueFees().length;
        const totalExpected = this.calculateTotalExpectedFee();
        const totalCollected = this.calculateTotalCollectedFee();
        
        return {
            totalFees,
            paidFees,
            pendingFees: totalFees - paidFees,
            overdueFees,
            collectionRate: this.calculateCollectionRate(),
            totalExpectedAmount: totalExpected,
            totalCollectedAmount: totalCollected,
            totalPendingAmount: totalExpected - totalCollected,
            totalPenalties: this.calculateTotalWithPenalties() - totalExpected
        };
    }
}

export default new FeeService();
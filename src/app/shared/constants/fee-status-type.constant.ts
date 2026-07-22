export const FeePaymentStatus = {
    "Unpaid": 1,
    "Pending": 2,
    "Partial": 3,
    "Overdue": 4,
    "Late Paid": 5,
    "Paid": 6
}

export const getFeePaymetStatusClass = (status: number): string => {
    switch (status) {
        case FeePaymentStatus.Unpaid: return 'unpaid';
        case FeePaymentStatus.Pending: return 'pending';
        case FeePaymentStatus.Partial: return 'partial';
        case FeePaymentStatus.Overdue: return 'overdue';
        case FeePaymentStatus["Late Paid"]: return 'late-paid';
        case FeePaymentStatus.Paid: return 'paid';
        default: return 'default';
    }
}

export const isFeeStatusPaid = (status: number): boolean => {
    return status === FeePaymentStatus.Paid || status === FeePaymentStatus["Late Paid"];
}
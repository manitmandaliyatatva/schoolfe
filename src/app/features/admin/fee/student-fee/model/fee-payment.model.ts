import { createGenericStore } from "../../../../../core/store/resource.store";
import { StudentFee } from "./student-fee.model";

import { StripeGatewayConfig } from "../../../../../shared/components/stripe-gateway-dialog/models/stripe-gateway.model";

export interface PayFeesDialogData<T = any> {
    fees: StudentFee[];
    stripeConfig?: StripeGatewayConfig<T>;
    onSave?: (result: PayFeesDialogResult) => void;
}

export interface PayFeesDialogResult {
    feeStudentIds: string[];
    totalAmount: number;
    paymentMode: number;
    transactionId: string | null;
    remarks: string | null;
}

export const FeePaymentConst = {
    CONFIRM_MESSAGE: 'Once the fee is paid, this record cannot be changed. Are you sure you want to proceed?',
    CONFIRM_TITLE: 'Confirm Fee Payment',
    CONFIRM_BUTTON: 'Yes, Proceed',
}

export interface FeePayment {
    feePaymentId: string;
    studentId: string;
    totalAmount: number;
    paymentDate?: string;
    paymentMode: number;
    transactionRef?: string | null;
    remarks?: string | null;
    receivedBy?: string | null;
    isActive?: boolean | null;
    feeStudentsIDList: string[];
}

export const feePaymentStore = createGenericStore<FeePayment>();

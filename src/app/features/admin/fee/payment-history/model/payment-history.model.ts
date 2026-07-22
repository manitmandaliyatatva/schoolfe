import { IPaginationRequest } from "../../../../../core/models/request.model";
import { createGenericStore } from "../../../../../core/store/resource.store";
import { Base64Document } from "../../../../../shared/models/document.model";

export interface StudentFeeListRequest extends IPaginationRequest {
  classId: string;
}

export interface FeePaymentHistoryRequest extends IPaginationRequest {
  studentId: string;
}

export interface StudentFeePaymentDetails {
    studentId: string;
    fullName: string;
    admissionNumber: string;
    photo: string;
    classSectionName: string;
    classSectionId: string;
    rollNumber: number;
    phoneNumber: string;
    totalPaidAmount: number;
    lastPaymentDate: string;
}

export interface FeePaymentDetails {
    feePaymentDetailId: string;
    feePaymentId: string;
    paymentDate: string;
    paymentMode: number;
    paymentModeName: string;
    transactionRef: string;
    remarks: string;
    receivedBy: string;
    receivedByName?: string;
    paidAmount: number;
    feeTypeName: string;
    feeTypeFrequency: number;
    isActive: boolean;
}

export const studentFeePaymentDetailsStore = createGenericStore<StudentFeePaymentDetails>();
export const feePaymentDetailsStore = createGenericStore<FeePaymentDetails>();
export const receiptBase64Store = createGenericStore<Base64Document>();

export const PaymentHistoryConst = {
  PAYMENT_DATE: 'Payment Date',
  TRANSACTION_REF: 'Transaction Ref',
  RECEIVED_BY: 'Received By',
  LAST_PAYMENT_DATE: 'Last Payment Date',
  STUDENT_NAME: 'Student Name:',
  ROLL_NO: 'Roll No:',
};
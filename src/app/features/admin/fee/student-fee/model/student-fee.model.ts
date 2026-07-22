import { IPaginationRequest } from "../../../../../core/models/request.model";
import { createGenericStore } from "../../../../../core/store/resource.store"
import { FeeAdjustment } from "../../fee-adjustment/model/fee-adjustment.model";

export interface StudentFeeListRequest extends IPaginationRequest {
  classId: string;
  feeTypeId: string;
  status: number;
}

export interface StudentFee {
    feeStudentId: string;
    feeStructureId: string;
    feeTypeName?: string;
    studentId: string;
    studentName?: string;
    amount: number;
    dueDate: string;
    lateFeeAmount?: number;
    paidAmount: number;
    remainingAmount: number;
    adjustedAmount: number;
    adjustedAmountList: FeeAdjustment[];
    status?: number;
    statusName?: string;
    isActive?: boolean;
}

export const StudentFeeConst = {
    FEE_STUDENT_ID: 'feeStudentId',
    ADJUSTMENTS_BREAKDOWN: 'Adjustments Breakdown',
    SECURE_PAYMENT_GATEWAY: 'Secure Payment Gateway',
    PAID_VIA_COMMON_STRIPE_GATEWAY: 'Paid via Common Stripe Gateway',
    FEE_TYPE: 'Fee Type'
}

export const studentFeeStore = createGenericStore<StudentFee>();

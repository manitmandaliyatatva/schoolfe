import { IPaginationRequest } from "../../../../../core/models/request.model";
import { createGenericStore } from "../../../../../core/store/resource.store";
import { DropdownOption } from "../../../../../shared/models/Dropdown.model";

export interface FeeAdjustment {
    feeAdjustmentId?: string;
    feeStudentId: string;
    studentName?: string;
    feeTypeName?: string;
    feeStatus?: number;
    feeStatusName?: string;
    adjustmentTypeName?: string;
    remainingAmount?: number;
    adjustmentType: number;
    amount: number;
    remarks?: string | null;
    isActive: boolean;
}

export interface FeeAdjustmentListRequest extends IPaginationRequest {
    feeTypeId?: string;
    adjustmentType?: number;
    feeStatus?: number;
}

export interface UnpaidStudentFeeDropdown extends DropdownOption {
    remainingAmount: number;
}

export interface FeeAdjustmentDialogData {
    feeAdjustmentId?: string;
    feeStudentId: string;
    studentName: string;
    feeTypeName?: string;
    feeStatus?: number;
    remainingAmount?: number;
    onSave?: (result: FeeAdjustment) => void;
}

export const FeeAdjustmentConst = {
    ID: 'ID',
    STUDENT_NAME: 'Student Name',
    STUDENT_FEE_TITLE: 'Student Fee',
    ADJUST_FEE: 'Adjust Fee',
    FEE_ALREADY_PAID: 'Fee is already paid.',
    EXCEED_AMOUNT_ERROR: (maxAmount: string) => `Amount cannot exceed the remaining amount of ${maxAmount}.`
}

export const FeeAdjustmentRoute = "/admin/fee/fee-adjustments";

export const feeAdjustmentStore = createGenericStore<FeeAdjustment>();

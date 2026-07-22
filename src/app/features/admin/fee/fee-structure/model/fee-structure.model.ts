import { createGenericStore } from "../../../../../core/store/resource.store"

export interface FeeStructure {
    feeStructureId: string;
    classId: string;
    className?: string;
    feeTypeId: string;
    feeTypeName?: string;
    academicYearName?: string;
    amount: number;
    startDate: string;
    endDate: string;
    dueDate: string;
    isPublished?: boolean;
    isActive: boolean;
}

export interface PublishFeeStructure {
    feeStructureId: string;
}

export const FeeStructureConst = {
    FEE_STRUCTURE_ID: 'feeStructureId',
    END_DATE_PAST_ERROR: 'This Fee Structure cannot be published as the end date has already passed.',
    DUE_DATE_PAST_ERROR: 'This Fee Structure cannot be published as the due date has already passed.',
    PUBLISH: 'Published',
}

export const feeStructureStore = createGenericStore<FeeStructure>();
export const publishFeeStructureStore = createGenericStore<PublishFeeStructure>();
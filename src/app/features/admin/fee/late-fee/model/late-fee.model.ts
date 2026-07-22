import { createGenericStore } from "../../../../../core/store/resource.store"

export interface ILateFeeConfig {
    lateFeeConfigId: string;
    feeTypeId: string;
    feeTypeName: string;
    daysFrom: number;
    daysTo: number;
    lateFeeAmount: number;
    isPercentage: boolean | null;
    isActive: boolean;
}

export const LateFeeConst = {
    ID: 'ID',
    DAYS_FROM: 'Days From',
    DAYS_TO: 'Days To',
    LATE_FEE_AMOUNT: 'Late Fee Amount',
    IS_PERCENTAGE: 'Is Percentage',
    LATE_FEE_CONFIGURATION: 'Late Fee Configuration',
}

export const lateFeeStore = createGenericStore<ILateFeeConfig>();

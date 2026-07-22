import { createGenericStore } from "../../../../../core/store/resource.store"

export interface IFeeType {
    feeTypeId: string;
    name : string
    code : string
    frequency : number
    frequencyName? : string;
    isActive : boolean
}

export const feeTypeStore = createGenericStore<IFeeType>();
import { createGenericStore } from "../../../../../core/store/resource.store";

export interface IFacility {
    id: string;
    title: string;
    description: string;
    icon: string;
    isActive: boolean;
    isDeleted: boolean;
    createdBy: string;
    createdOn: string;
    updatedBy: string | null;
    updatedOn: string | null;
    deletedBy: string | null;
    deletedOn: string | null;
}

export const facilityStore = createGenericStore<IFacility>();
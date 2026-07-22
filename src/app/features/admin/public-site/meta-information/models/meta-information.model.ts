import { createGenericStore } from "../../../../../core/store/resource.store";

export interface IMetaInformation {
    metaInformationId: string;
    phoneNo: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    officialEmail: string;
    aboutContent: string;
    isActive: boolean;
    isDeleted: boolean;
    createdBy: string;
    createdOn: string;
    updatedBy: string | null;
    updatedOn: string | null;
    deletedBy: string | null;
    deletedOn: string | null;
}

export const metaStore = createGenericStore<IMetaInformation>();
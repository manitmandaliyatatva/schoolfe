import { createGenericStore } from "../../../../../core/store/resource.store";

export interface ITestimonials {
    testimonialId: string;
    personName: string;
    designation: string;
    reviewMessage: string;
    profileImageUrl: string;
    rating: number | null;
    isActive: boolean;
    isDeleted: boolean;
    createdBy: string;
    createdOn: string;
    updatedBy: string | null;
    updatedOn: string | null;
    deletedBy: string | null;
    deletedOn: string | null;
    isPhotoReplaced:boolean;
    fileName:string;
}

export const testimonialStore = createGenericStore<ITestimonials>();
import { createGenericStore } from "../../../../../core/store/resource.store";

export interface IContactUsInquiryDto {
    contactUsInquiryId: string;
    fullName: string;
    email: string;
    message: string;
    isRead: boolean;
    isReplied: boolean;
    isActive: boolean;
}

export const contactStore = createGenericStore<IContactUsInquiryDto>();
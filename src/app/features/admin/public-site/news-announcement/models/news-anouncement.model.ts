import { createGenericStore } from "../../../../../core/store/resource.store";

export interface NewsAnnouncement {
    newsId: string;
    category: string;
    metaDescription: string;
    description: string;
    newsDate: string;
    title: string;
    imageUrl: string;
    isActive: boolean;
    isDeleted: boolean;
    createdBy: string;
    createdOn: string;
    updatedBy: string | null;
    updatedOn: string | null;
    deletedBy: string | null;
    deletedOn: string | null;
}

export const newsStore = createGenericStore<NewsAnnouncement>();
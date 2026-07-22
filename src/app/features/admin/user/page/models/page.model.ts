import { createGenericStore } from "../../../../../core/store/resource.store";

export interface Page {
    pageId: string;
    pageName: string;
    pageCode: string;
    url?: string;
    parentPageId?: string | null;
    sortOrder?: number | null;
    userTypeId: string;
    userTypeName?: string;
    isActive: boolean;
    mnemonic: string;
    isAction: boolean;
    parentPageName: string;
    permissionsToCreate?: string[];
}

export const pageStore = createGenericStore<Page>();

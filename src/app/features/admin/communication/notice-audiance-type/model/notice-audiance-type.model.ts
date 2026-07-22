import { createGenericStore } from "../../../../../core/store/resource.store";

export interface INoticeAudianceType {
    noticeAudienceTypeId: string;
    name: string;
    description: string;
    isActive: boolean;
}


export const NOTICE_AUDIANCE_TYPE = {
    BASIC_INFORMATION : "Basic Information",
    DELETE_ROLE: 'Delete Notice Type',
    CONFIRM_DELETE(name: string) { return `Are you sure you want to delete "${name}"?`; },
    NOTICE_AUDIANCE_TYPE_ID : "Notice Audiance Type Id",
    NOTICE_AUDIANCE_TYPE_NAME: 'Notice Audiance Type Name',
    NOTICE_AUDIANCE_TYPE_DESCRIPTION: 'Notice Audiance Description',
    ACTIVE: 'Active',
    IS_ACTIVE: 'Is Active?',
    DELETE: 'Delete',
    CANCEL: 'Cancel',
    SAVE: 'Save',
};

export const noticeAudianceTypeStore = createGenericStore<INoticeAudianceType>();
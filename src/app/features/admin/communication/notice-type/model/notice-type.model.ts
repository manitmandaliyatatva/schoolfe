import { createGenericStore } from "../../../../../core/store/resource.store";

export interface INoticeType {
    noticeTypeId: string;
    noticeTypeName: string;
    noticeTypeCode: string;
    allowAdmin: boolean;
    allowTeacher: boolean;
    isActive: boolean;
}


export const NOTICE_TYPE = {
    BASIC_INFORMATION : "Basic Information",
    DELETE_NOTICE_TYPE: 'Delete Notice Type',
    CONFIRM_DELETE(name: string) { return `Are you sure you want to delete "${name}"?`; },
    NOTICE_TYPE_ID : "Notice Type Id",
    NOTICE_TYPE_NAME: 'Notice Type Name',
    NOTICE_TYPE_CODE: 'Notice Type Code',
    ACTIVE: 'Active',
    ALLOW_ADMIN :"Allow Admin",
    ALLOW_TEACHER :"Allow Teacher",
};

export const noticeTypeStore = createGenericStore<INoticeType>();
import { createGenericStore } from "../../../../../core/store/resource.store";

export interface INotice {
    noticeId: string;
    title: string;
    description: string;
    noticeTypeName: string;
    audienceType: string;
    expiryDate: string;
    isActive: boolean;
    isImportant: boolean;
    attachmentFileName: string;
    attachmentFilePath: string;
    noticeTypeId: string;
    publishDate: string;
    noticeFile: string;
    isFileDeleted: boolean;
    audiences: any[];
    audienceTypeId: string;
    noticeGroupId: string;
    noticeGroupName: string;
}

export interface INoticeAudianceType {
    noticeAudienceTypeName: string;
    refId: string | null;
    noticeAudienceTypeId: string;
}

export const NOTICE = {
    BASIC_INFORMATION: "Basic Information",
    DELETE_ROLE: 'Delete Notice Type',
    CONFIRM_DELETE(name: string) { return `Are you sure you want to delete "${name}"?`; },
    NOTICE_TYPE_ID: "Notice Id",
    NOTICE_TYPE : "Notice Type",
    NOTICE_GROUP : "Notice Group",
    DESCRIPTION: 'Description',
    IS_IMPORTANT: "Is Important",
    IMPORTANT : "Important",
    PUBLISH_DATE : 'Publish Date',
    EXPIRY_DATE :'Expiry Date',
    AUDENCE_TYPE : 'Audience Type',
    TITLE : 'Title',
    NOTICE_GROUP_NAME : 'Notice Group Name',
    NOTICE_AUDIANCE_TYPE :"Notice Audiance Type",
    CONFIRM_SAVE: 'Confirm Save',
    CONFIRM_PUBLISH_TODAY: "The publish date is set to today. You will not be able to edit this notice afterwards, except for its expiry date. Do you want to proceed?",
    CONFIRM_BOTH_TODAY: "Both publish and expiry dates are set to today. This notice will not be editable afterwards. Do you want to proceed?"
};

export const noticeStore = createGenericStore<INotice>();
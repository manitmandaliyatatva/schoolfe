import { createGenericStore } from "../../../../../core/store/resource.store"
import { API } from "../../../../../shared/constants/api-url"
import { NoticeAudienceType } from "../../../../../shared/constants/notice-audiance-type.constant";
import { ITextValueOption } from "../../../../../shared/models/common.model"

export interface INoticeAudienceGroup {
    noticeGroupId: string;
    noticeGroupName: string;
    isActive: boolean;
    noticeGroupAudienceId: string;
    noticeAudienceTypeId: string;
    noticeAudienceTypeName: string;
    refIds: string[];
    refIdsName: string[];
}

export const noticeAudienceGrpStore = createGenericStore<INoticeAudienceGroup>();
export const genericDropdownStore = createGenericStore<ITextValueOption>();

export const NoticeAudianceConst = {
    GROUP_NAME: "Group Name"
}

export const MapAPIByKey: Record<string, IMapAPIByKeyForNotice> = {
    [NoticeAudienceType.All]: {
        defaultRefId: null,
        isApiLoad: false
    },
    [NoticeAudienceType.Student]: {
        isApiLoad: false,
        label: "Student List",
        defaultRefId: null
    },
    [NoticeAudienceType.Teacher]: {
        defaultRefId: null,
        isApiLoad: false,
    },
    [NoticeAudienceType.Parent]: {
        isApiLoad: false,
        defaultRefId: null,
    },
    [NoticeAudienceType.Employee]: {
        isApiLoad: false,
        defaultRefId: null,
    },
    [NoticeAudienceType.Class]: {
        isApiLoad: true,
        label: "Class List"
    },
    [NoticeAudienceType.ClassRoom]: {
        isApiLoad: true,
        label: "Class Room List"
    },
    [NoticeAudienceType.SpecificStudent]: {
        isApiLoad: true,
        label: "Student List"
    },
    [NoticeAudienceType.SpecificTeacher]: {
        isApiLoad: true,
        label: "Teacher List"
    },
    [NoticeAudienceType.AllRoles]: {
        isApiLoad: false,
        defaultRefId: null
    },
    [NoticeAudienceType.SpecificRole]: {
        isApiLoad: true,
        label: "Role List"
    },
}

export interface IMapAPIByKeyForNotice {
    isApiLoad: boolean,
    defaultRefId?: string | null,
    label?: string;
}

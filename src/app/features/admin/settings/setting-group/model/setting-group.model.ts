import { createGenericStore } from "../../../../../core/store/resource.store";
import { SettingDefinition } from "../../setting-defination/model/setting-defination.model";

export interface SettingGroup {
    settingGroupId: string;
    groupName: string;
    groupCode: string;
    isPublicSetting: boolean;
    isActive: boolean;
    isDeleted: boolean;
    createdBy: string;
    createdOn: string;
    updatedBy: string | null;
    updatedOn: string | null;
    deletedBy: string | null;
    deletedOn: string | null;
    settingDefinitions: SettingDefinition[];
}

export const settingGroupStore = createGenericStore<SettingGroup>();
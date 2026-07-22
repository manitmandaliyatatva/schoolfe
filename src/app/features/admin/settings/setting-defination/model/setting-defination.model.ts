import { createGenericStore } from "../../../../../core/store/resource.store";
import { SettingGroup } from "../../setting-group/model/setting-group.model";

export interface SettingDefinition {
    settingDefinitionId: string;
    settingGroupId: string;
    settingKey: string;
    settingLabel: string;
    controlType: string;
    dataType: string;
    settingValue: string;
    placeholder: string;
    isRequired: boolean | null;
    minLength: number | null;
    maxLength: number | null;
    regexPattern: string;
    dropdownOptions: string;
    isActive: boolean;
    isDeleted: boolean;
    createdBy: string;
    createdOn: string;
    updatedBy: string | null;
    updatedOn: string | null;
    deletedBy: string | null;
    deletedOn: string | null;
    displayOrder: number;
    settingGroup: SettingGroup;
    settingGroupName : string;
}

export const settingDefinitionStore = createGenericStore<SettingDefinition>();
import { createGenericStore } from "../../../../../../store/resource.store";

export interface HeaderFilter {
    academicYearId: string;
    branchId: string;
    userTypeName?: string;
}

export interface BranchDropdownResponse {
  branchId: string;
  branchName: string;
  userTypes: BranchUserType[];
}

export interface BranchUserType {
  userTypeId: string;
  userTypeName: string;
}

export const headerFilterStore = createGenericStore<HeaderFilter>();
export const branchDropdownStore = createGenericStore<BranchDropdownResponse>();

export const ROLE_ICON_MAPPING: Record<string, string> = {
    admin: 'shield',
    teacher: 'co_present',
    faculty: 'co_present',
    student: 'school',
    parent: 'family_restroom'
};

export const HEADER_FILTER_CONST = {
    CONFIRM_TITLE: 'Confirm Filter Change',
    CONFIRM_MESSAGE: 'Are you sure you want to change the selected filters?',
    CONFIRM_ROLE_CAMPUS_CHANGE_TITLE: 'Confirm Role & Branch Change',
    CONFIRM_ROLE_CAMPUS_CHANGE_MESSAGE: (role: string, branch: string) => `Are you sure you want to switch to ${role} at ${branch}?`,
    MENU_TITLE: 'Switch branch & role',
    CURRENTLY_LABEL: 'Currently:',
    YOUR_BRANCHES_TITLE: 'YOUR BRANCHES',
    ACTIVE_LABEL: 'active',
    AVAILABLE_LABEL: 'available',
    ROLE_SINGULAR: 'role',
    ROLES_PLURAL: 'roles',
    FOOTER_INFO: 'Select a branch then choose your role'
};
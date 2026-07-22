import { createGenericStore } from "../../../../../core/store/resource.store";

export interface Role {
    roleId: string;
    roleName: string;
    userTypeId: string;
    userTypeName?: string;
    isActive: boolean;
    isSuperAdmin?: boolean;
    isEditable?: boolean;
    isPrimaryRole?: boolean;
}

export const ROLE_CONST = {
    IS_PRIMARY_ROLE: 'Is Primary role?',
    CONFIRM_PRIMARY_ROLE: 'There can only be one primary role. If a primary role already exists, it will be overridden with this one. Do you wish to continue?',
    PRIMARY_ROLE: 'Primary Role'
}

export const roleStore = createGenericStore<Role>();

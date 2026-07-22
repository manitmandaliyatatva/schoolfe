import { createGenericStore } from "../../../../../core/store/resource.store";
import { EmailConfirmation } from "../../../../../core/models/email-validation.model";

export interface User extends EmailConfirmation {
    userId: string;
    firstName: string;
    middleName: string;
    lastName: string;
    fullName?: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
    userRoleList?: UserRole[];
}

export interface UserRole {
    userTypeId: string;
    userTypeName?: string;
    roleId?: string;
    roleName?: string;
    isActive?: boolean;
}

export const userStore = createGenericStore<User>();

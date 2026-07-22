import { createGenericStore } from '../../../../../core/store/resource.store';

export interface RolePermissionTree {
  pageId: string;
  pageName: string;
  pageCode: string;
  url: string;
  mnemonic: string | null;
  isAction: boolean;
  parentPageId: string | null;
  userTypeId: string;
  isAllowed: boolean;
  permissions: RolePermissionTree[];
}

export interface RoleBasedPermissionsDto {
  roleId: string;
  permissionTree: RolePermissionTree;
}

export interface DropdownItem {
  value: string;
  label: string;
}

export const userTypeStore = createGenericStore<any>();
export const rolesStore = createGenericStore<any>();
export const permissionTreeStore = createGenericStore<RolePermissionTree[]>();
export const permissionSaveStore = createGenericStore<any>();


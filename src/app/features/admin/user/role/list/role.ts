import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import {
  CommonDataGridActionButtonConfig,
  CommonDataGridColumnConfig,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { UserTypeConst } from '../../../../../shared/constants/user-type.constants';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { Role, ROLE_CONST, roleStore } from '../models/role.model';

@Component({
  selector: 'app-role',
  imports: [CommonModule, CommonDataGridComponent, MatButtonModule],
  providers: [roleStore],
  templateUrl: './role.html',
})
export class RoleComponent extends GridBase<Role> {
  private readonly authStore = inject(AuthStore);

  protected override store = inject(roleStore);
  protected override apiEndpoint = API.ADMIN.USER.ROLE.LIST;
  protected override deleteEndpoint = API.ADMIN.USER.ROLE.DELETE;
  protected override primaryKey: keyof Role = 'roleId';
  protected override pageTitle = `${TITLES.USER.ROLE}`;
  protected override routeBasePath = '/admin/user/roles';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: Role) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.roleName);

  private canModifyRole = (data: Role | undefined, hasPermission: boolean): boolean => {
    if (!hasPermission) return false;
    if (!data) return true;
    if (
      data.isSuperAdmin
      || CommonHelper.compareGuid(data.userTypeId, UserTypeConst.Student)
      || CommonHelper.compareGuid(data.userTypeId, UserTypeConst.Parent)
    ) return false;
    const isPrimaryAdmin = data.isPrimaryRole && CommonHelper.compareGuid(data.userTypeId, UserTypeConst.Admin);
    return this.authStore.isSuperAdmin() || !isPrimaryAdmin;
  };

  protected override get baseActionButtons(): CommonDataGridActionButtonConfig<Role>[] {
    return [
      {
        matIconName: 'edit',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
        callback: this.onEditClick,
        visibleCallback: (data?: Role) => data.isEditable !== false && this.canModifyRole(data, this.permission().canUpdate || this.permission().canView),
      },
      {
        matIconName: 'delete',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        callback: this.onDeleteClick,
        visibleCallback: (data?: Role) => this.canModifyRole(data, this.permission().canDelete),
      },
    ];
  }

  protected override buildColumns = (): CommonDataGridColumnConfig<Role>[] => {
    return [
      {
        title: SYSTEM_CONST.LABELS.ROLE.ROLE_ID,
        field: 'roleId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.ROLE.ROLE_NAME,
        field: 'roleName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.USER.USER_TYPE,
        field: 'userTypeName',
        isSortable: true,
      },
      {
        title: ROLE_CONST.PRIMARY_ROLE,
        field: 'isPrimaryRole',
        isSortable: false,
        fieldDataType: CommonDataGridFieldDataType.BooleanIcon,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true,
      },
    ];
  };
}


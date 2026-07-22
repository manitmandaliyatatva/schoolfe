import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { FormGroup } from '@angular/forms';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { ButtonType } from '../../../../../core/models/common.model';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import {
  CommonDataGrid,
  CommonDataGridActionButtonConfig,
  CommonDataGridColumnConfig,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { getDropdownConfig } from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { User, userStore } from '../models/user.model';
import { UserDetailsDialog } from './user-details-dialog/user-details-dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LookupMnemonics } from '../../../../../shared/constants/lookup-type-ids.constant';
import { AuthStore } from '../../../../../core/store/auth.store';

@UntilDestroy()
@Component({
  selector: 'app-user',
  imports: [CommonModule, CommonDataGridComponent],
  providers: [userStore],
  templateUrl: './user.html',
})
export class UserComponent extends GridBase<User> implements OnInit, OnDestroy {
  private readonly authStore = inject(AuthStore);

  private readonly DROPDOWN_KEYS = {
    role: 'userListRole',
    userType: 'userListUserType',
  } as const;

  protected override store = inject(userStore);
  protected override isAddButton = () => {
    if (this.authStore.isAdmin() && !this.authStore.isSuperAdmin() && !this.authStore.isPrimaryAdmin()) {
      return false;
    }
    return true;
  };
  protected override apiEndpoint = API.ADMIN.USER.USERS.LIST;
  protected override deleteEndpoint = API.ADMIN.USER.USERS.DELETE;
  protected override primaryKey: keyof User = 'userId';
  protected override pageTitle = `${TITLES.USER.USERS}`;
  protected override routeBasePath = 'admin/user/users';
  protected override skipViewPermissionForEdit = true;
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: User) => {
    const roles = this.getRoleList(row);
    return SYSTEM_CONST.ACTIONS.CONFIRM_USER_ACTION('delete', row.fullName || row.firstName, 'user', roles);
  }

  private readonly genericDialog = inject(GenericDialogService);
  private readonly dropdownStore = inject(CommonDropdownStore);

  private roleTemplate = viewChild<TemplateRef<any>>("roleTemplate");

  readonly roleDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.role);
  readonly userTypeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.userType);
  private lastLoadedUserTypeId: string | null = null;

  constructor() {
    super();
    this.registerDropdownReactivity('roleId', this.roleDropdownList);
    this.registerDropdownReactivity('userTypeId', this.userTypeDropdownList);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.userType,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.UserTypeIds }
    });
  }

  getRoleList = (data: User): string => {
    return data.userRoleList?.map(r => r.userTypeName).filter(n => !!n).join(', ') || '-';
  }

  private updateFormControlOptions(formControlName: string, options: ITextValueOption[]): void {
    const filterForm = this.gridConfig?.features?.filter?.form;
    if (!filterForm) return;

    for (const section of filterForm.formSection) {
      const controlConfig = section.controls?.find(
        (c) => (c.control as any).formControlName === formControlName
      );
      if (controlConfig) {
        (controlConfig.control as any).data = options;
        controlConfig.control = { ...controlConfig.control };
      }
    }
    this.gridConfig = { ...this.gridConfig };
  }

  private loadRoles(userTypeId: any): void {
    if (this.lastLoadedUserTypeId === userTypeId) return;
    this.lastLoadedUserTypeId = userTypeId;

    if (!CommonHelper.isEmpty(userTypeId)) {
      this.dropdownStore.getDropdown({
        key: this.DROPDOWN_KEYS.role,
        endpoint: API.ADMIN.USER.ROLE.ROLEBYUSERTYPE,
        params: { userTypeId: userTypeId },
        force: true,
        mapData: (items: any[]) => items.map(item => ({
          text: item.text,
          value: item.value?.toLowerCase(),
          mnemonic: item.mnemonic
        }))
      });
    } else {
      this.dropdownStore.resetKey(this.DROPDOWN_KEYS.role);
    }
  }

  private onFilterFormInit(form: FormGroup): void {
    const userTypeControl = form.get('userTypeId');

    if (userTypeControl?.value) {
      this.loadRoles(userTypeControl.value);
    }

    userTypeControl?.valueChanges.pipe(untilDestroyed(this)).subscribe((userTypeId) => {
      form.get('roleId')?.setValue(null, { emitEvent: false });
      this.loadRoles(userTypeId);
    });
  }

  protected override buildGridConfig(): CommonDataGrid<User> {
    const config = super.buildGridConfig();
    config.features = {
      ...config.features,
      showSearch: true,
      filter: {
        formGroupCallback: (form) => this.onFilterFormInit(form),
        form: {
          formSection: [
            {
              controls: [
                {
                  control: {
                    ...getDropdownConfig(
                      'userTypeId',
                      SYSTEM_CONST.LABELS.USER.USER_TYPE,
                      this.userTypeDropdownList()
                    ),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: {
                    ...getDropdownConfig(
                      'roleId',
                      SYSTEM_CONST.LABELS.USER.ROLE,
                      this.roleDropdownList()
                    ),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
              ],
            },
          ],
        },
      },
    };
    return config;
  }

  private registerDropdownReactivity(
    formControlName: string,
    source: () => ITextValueOption[]
  ): void {
    effect(() => {
      const options = source();
      untracked(() => this.updateFormControlOptions(formControlName, options));
    });
  }

  protected override buildColumns = (): CommonDataGridColumnConfig<User>[] => {
    return [
      {
        title: SYSTEM_CONST.LABELS.USER.USER_ID,
        field: 'userId',
        isHidden: true
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.FULL_NAME,
        field: 'fullName',
        isSortable: true
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.EMAIL,
        field: 'email',
        isSortable: true
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.PHONE_NUMBER,
        field: 'phoneNumber',
        fieldDataType: CommonDataGridFieldDataType.PhoneNumber,
        isSortable: true
      },
      {
        title: SYSTEM_CONST.LABELS.USER.USER_TYPE,
        field: 'userRoleList',
        isSortable: false,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.roleTemplate(),
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true
      },
    ];
  }

  protected override get extraActionButtons(): CommonDataGridActionButtonConfig<User>[] {
    return [
      {
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
        matIconName: 'visibility',
        tooltipText: this.commonHelperService.handleButtonText(SYSTEM_CONST.LABELS.USER.USER, ButtonType.View),
        callback: this.onViewClick,
        visibleCallback: () => this.permission().canView
      },
    ]
  }

  private onViewClick = (row: User): void => {
    this.genericDialog.open({
      width: '720px',
      panelClass: 'custom-modal-wrap',
      disableClose: true,
      title: 'User Details',
      component: UserDetailsDialog,
      data: row,
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dropdownStore.resetState();
  }
}


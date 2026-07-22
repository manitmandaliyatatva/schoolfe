import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getButtonConfig, getDropdownConfig, getSlideToggleConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { UserTypeConst } from '../../../../../shared/constants/user-type.constants';
import { roleStore, Role, ROLE_CONST } from '../models/role.model';
import { API } from '../../../../../shared/constants/api-url';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { FormUtils } from '../../../../../core/helpers/form-utils';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { LookupMnemonics } from '../../../../../shared/constants/lookup-type-ids.constant';

@Component({
  selector: 'app-role-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, MatButtonModule, ButtonComponent],
  providers: [roleStore],
  templateUrl: './role-form.html',
})
export class RoleForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly authStore = inject(AuthStore);
  readonly roleStore = inject(roleStore);
  private readonly dropdownStore = inject(CommonDropdownStore);

  private readonly editRoleId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.editRoleId() !== null);
  readonly isSaveClicked = signal<boolean>(false);

  permission = computed(() => this.commonHelperService.getPermissionByPage());
  saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onSave(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true),
    cssClasses: ['btn', 'primary-btn'],
  });
  cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn'],
  });

  formGroup = this.fb.nonNullable.group({
    roleId: this.fb.control(EMPTY_GUID),
    roleName: this.fb.control('', [Validators.required, FormUtils.onlyString]),
    userTypeId: this.fb.control<string | null>(null, Validators.required),
    isActive: this.fb.control(true),
    isPrimaryRole: this.fb.control(false),
  });

  formControls!: DynamicForm;
  private readonly DROPDOWN_KEY = 'roleFormUserTypeList';
  protected readonly userTypeList = this.dropdownStore.getList(this.DROPDOWN_KEY);

  constructor() {
    effect(() => {
      const p = this.permission();
      if (this.isEditMode()) {
        if (!p.canView && !p.canUpdate) this.onCancel();
        if (!p.canUpdate) this.formGroup.disable();
      } else {
        if (!p.canCreate) this.onCancel();
      }
    });
    effect(() => {
      if (this.isSaveClicked() && this.roleStore.isSuccess()) {
        this.onCancel();
      }
    });

    effect(() => {
      if (!this.isEditMode()) return;
      const roleData = this.roleStore.data();
      if (!roleData) return;
      this.patchForm(roleData);
    });

    effect(() => {
      // Allow only roles for Admin & Teacher
      const options = this.userTypeList().filter(x => [UserTypeConst.Admin, UserTypeConst.Teacher].includes(x.value as string));
      untracked(() => {
        if (this.formControls) {
          const control = this.formControls.formSection[0].controls.find(c => (c.control as any).formControlName === 'userTypeId');
          if (control) {
            (control.control as any).data = options;
            control.control = { ...control.control };
            this.formControls = { ...this.formControls };
          }
        }
      });
    });
  }

  ngOnInit(): void {
    this.roleStore.resetState();
    this.resolveEditMode();

    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEY,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.UserTypeIds }
    });

    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.ROLE.ROLE_NAME, 'roleName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getDropdownConfig('userTypeId', SYSTEM_CONST.LABELS.USER.USER_TYPE, [], null, null, () => {
                  if (!CommonHelper.compareGuid(this.formGroup.controls.userTypeId.value ?? '', UserTypeConst.Teacher)) {
                    this.formGroup.controls.isPrimaryRole.setValue(false);
                  }
                }),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
            {
              control: getSlideToggleConfig('isPrimaryRole', ROLE_CONST.IS_PRIMARY_ROLE),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-6 col-xl-6',
              isHiddenField: () => !CommonHelper.compareGuid(this.formGroup.controls.userTypeId.value ?? '', UserTypeConst.Teacher),
            },
          ],
        },
      ],
    };
  }

  onSave = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.getRawValue();
    const saveRequest = () => {
      this.isSaveClicked.set(true);
      this.roleStore.create({
        endpoint: API.ADMIN.USER.ROLE.ADDUPDATE,
        body: this.formGroup.getRawValue() as Role,
      });
    };

    if (formValue.isPrimaryRole) {
      this.commonHelperService.confirmAndCallApi({
        title: SYSTEM_CONST.ACTION_BUTTONS.CONFIRM,
        message: ROLE_CONST.CONFIRM_PRIMARY_ROLE,
        confirmText: SYSTEM_CONST.ACTION_BUTTONS.CONFIRM,
        loadingSignal: this.isSaveClicked,
        request: saveRequest,
      });
    } else {
      saveRequest();
    }
  };

  onCancel = (): void => {
    this.router.navigate(['admin', 'user', 'roles']);
  };

  private resolveEditMode = (): void => {
    const roleIdParam = this.route.snapshot.paramMap.get('roleId');
    if (CommonHelper.isEmpty(roleIdParam)) return;

    this.editRoleId.set(roleIdParam);

    this.roleStore.getById({
      endpoint: API.ADMIN.USER.ROLE.GET,
      params: { roleId: roleIdParam },
    });
  };

  private patchForm = (role: Role): void => {
    this.formGroup.patchValue({
      roleId: CommonHelper.resolveId(role.roleId?.toLowerCase()),
      roleName: role.roleName ?? '',
      userTypeId: role.userTypeId?.toLowerCase() ?? null,
      isActive: role.isActive ?? true,
      isPrimaryRole: role.isPrimaryRole ?? false,
    });
  };
}

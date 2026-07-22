import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { finalize, forkJoin } from 'rxjs';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { FormUtils } from '../../../../../core/helpers/form-utils';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { API } from '../../../../../shared/constants/api-url';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { LookupMnemonics } from '../../../../../shared/constants/lookup-type-ids.constant';
import { UserTypeConst } from '../../../../../shared/constants/user-type.constants';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getDropdownConfig, getSlideToggleConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { ConfirmationService } from '../../../../../shared/services/dialog.service';
import { User, userStore } from '../models/user.model';
import { AuthStore } from '../../../../../core/store/auth.store';


@UntilDestroy()
@Component({
  selector: 'app-user-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, MatButtonModule, ButtonComponent],
  providers: [userStore],
  templateUrl: './user-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm extends BaseFormComponent<User> {
  private readonly fb = inject(FormBuilder);
  readonly store = inject(userStore);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly confirmService = inject(ConfirmationService);
  private readonly authStore = inject(AuthStore);
  private isPatching = false;

  protected override readonly getByIdEndpoint = API.ADMIN.USER.USERS.GET;
  protected override readonly entityIdParamKey = 'userId';

  private readonly DROPDOWN_KEYS = {
    roleType: 'roleType',
    userType: 'userType',
  };
  readonly roleTypeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.roleType);
  readonly userTypeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.userType);
  private roleTypeOptions: ITextValueOption[] = [];
  private lastLoadedUserTypeId: string | null = null;

  formGroup = this.fb.nonNullable.group({
    userId: this.fb.nonNullable.control<string | null>(EMPTY_GUID),
    firstName: this.fb.nonNullable.control('', [Validators.required, FormUtils.onlyStringNoSpace]),
    middleName: this.fb.nonNullable.control('', [Validators.required, FormUtils.onlyStringNoSpace]),
    lastName: this.fb.nonNullable.control('', [Validators.required, FormUtils.onlyStringNoSpace]),
    fullName: this.fb.nonNullable.control(''),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    phoneNumber: this.fb.nonNullable.control(null, Validators.required),
    userTypeId: this.fb.nonNullable.control(UserTypeConst.Admin, Validators.required),
    roleId: this.fb.nonNullable.control(null, Validators.required),
    roleIsActive: this.fb.nonNullable.control(true),
    isActive: this.fb.nonNullable.control(true),
  });

  formControls!: DynamicForm;

  constructor() {
    super();
    this.bindDropdownToControl('roleId', this.roleTypeDropdownList, (options) => {
      this.roleTypeOptions = options;
      if (options.length > 0) {
        const control = this.formGroup.get('roleId');
        if (control?.value) {
          control.setValue(control.value);
        }
      }
    });

    this.formGroup.controls['userTypeId'].valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      this.handleUserTypeChange(value);
    });

    effect(() => {
      const options = this.userTypeDropdownList();
      untracked(() => {
        if (this.formControls) {
          // Update the first userTypeId dropdown
          const roleSection = this.formControls.formSection.find(s => s.title === SYSTEM_CONST.SECTIONS.ROLE_AND_STATUS);
          if (roleSection) {
            const control = roleSection.controls.find(c => (c.control as any).formControlName === 'userTypeId');
            if (control) {
              (control.control as any).data = options;
              control.control = { ...control.control };
            }
            // Also update any dynamic userTypeId_i dropdowns
            roleSection.controls.forEach(c => {
              if ((c.control as any).formControlName?.startsWith('userTypeId_')) {
                (c.control as any).data = options;
                c.control = { ...c.control };
              }
            });
          }
          this.formControls = { ...this.formControls };
          this.cdr.detectChanges();
        }
      });
    });

    effect(() => {
      if (!this.isInitialized()) return;
      if (!this.isEditMode() && this.authStore.isAdmin() && !this.authStore.isSuperAdmin() && !this.authStore.isPrimaryAdmin()) {
        this.onCancel();
      }
    });
  }

  private getRoleString = (utid: any): string => {
    if (!utid) return '-';
    const matchedOption = this.userTypeDropdownList().find(
      (option) => option.value !== null && option.value !== undefined && String(option.value).toLowerCase() === String(utid).toLowerCase()
    );
    return matchedOption?.text || '-';
  }

  private getAllRolesString = (): string => {
    const rawValue = this.formGroup.getRawValue();
    const roles: string[] = [];
    
    if (rawValue.userTypeId) {
      roles.push(this.getRoleString(rawValue.userTypeId));
    }
    
    let i = 1;
    while (rawValue[`userTypeId_${i}`] !== undefined) {
      roles.push(this.getRoleString(rawValue[`userTypeId_${i}`]));
      i++;
    }
    
    return roles.filter(r => r !== '-').join(', ') || '-';
  }

  private readonly onIsActiveChange = (isActive: boolean): void => {
    if (isActive === false && !this.isPatching) {
      const rolesStr = this.getAllRolesString();
      const name = this.formGroup.controls['fullName'].value || this.formGroup.controls['firstName'].value;
      this.confirmService.confirmUserAction('inactivate', name, 'user', rolesStr).pipe(untilDestroyed(this)).subscribe((confirmed) => {
        if (!confirmed) {
          this.formGroup.controls['isActive'].setValue(true, { emitEvent: false });
          this.cdr.markForCheck();
        }
      });
    }
  };

  private readonly onRoleIsActiveChange = (roleIsActive: boolean, uKey: string, aKey: string): void => {
    if (roleIsActive === false && !this.isPatching) {
      const roleStr = this.getRoleString(this.formGroup.get(uKey)?.value);
      const name = this.formGroup.controls['fullName'].value || this.formGroup.controls['firstName'].value;
      this.confirmService.confirmUserAction('inactivate', name, 'role', roleStr).pipe(untilDestroyed(this)).subscribe((confirmed) => {
        if (!confirmed) {
          this.formGroup.get(aKey)?.setValue(true, { emitEvent: false });
          this.cdr.markForCheck();
        }
      });
    }
  };

  protected override loadData(): void {
    super.loadData();
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.userType,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.UserTypeIds }
    });

    if (!this.isEditMode()) {
      const userTypeId = this.formGroup.controls['userTypeId'].value;
      if (userTypeId) {
        this.handleUserTypeChange(userTypeId);
      }
    }
  }

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.PERSONAL,
          controls: [
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.FIRST_NAME, 'firstName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.MIDDLE_NAME, 'middleName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.LAST_NAME, 'lastName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.EMAIL, 'email', undefined, InputType.email, 'outline'),
              type: DynamicFormControlType.Email,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.PHONE_NUMBER, 'phoneNumber', undefined, InputType.contactNumber, 'outline'),
              type: DynamicFormControlType.ContactNumber,
              class: 'col-12 col-md-4',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE, undefined, undefined, this.onIsActiveChange),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-4 col-xl-4',
            },
          ],
        },
        {
          title: SYSTEM_CONST.SECTIONS.ROLE_AND_STATUS,
          controls: [
            {
              control: {
                ...getDropdownConfig('userTypeId', SYSTEM_CONST.LABELS.USER.USER_TYPE, this.userTypeDropdownList()),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-sm-6 col-lg-4 col-xl-4',
            },
            {
              control: {
                ...getDropdownConfig('roleId', SYSTEM_CONST.LABELS.USER.ROLE, this.roleTypeOptions),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-sm-6 col-lg-4 col-xl-4',
            },
            {
              control: getSlideToggleConfig('roleIsActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE, undefined, undefined, (val: boolean) => this.onRoleIsActiveChange(val, 'userTypeId', 'roleIsActive')),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-4 col-xl-4',
            },
          ],
        },
      ],
    };
    if (!this.isEditMode()) {
      FormUtils.disableDynamicFormFields(this.formGroup, this.formControls, ['userTypeId']);
    }
  }



  override onSave(): void {
    if (!this.isEditMode() && this.authStore.isAdmin() && !this.authStore.isSuperAdmin() && !this.authStore.isPrimaryAdmin()) {
      return;
    }
    super.onSave();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dropdownStore.resetState();
  }

  private readonly handleUserTypeChange = (userTypeId: string | null): void => {
    if (this.isPatching) return;
    if (CommonHelper.isEmpty(userTypeId)) {
      this.lastLoadedUserTypeId = null;
      this.formGroup.controls['roleId'].clearValidators();
      this.formGroup.controls['roleId'].setValue(null);
      this.dropdownStore.resetKey(this.DROPDOWN_KEYS.roleType);
      this.formGroup.controls['roleId'].updateValueAndValidity();
      this.cdr.markForCheck();
      return;
    }

    const utid = userTypeId!;
    if (this.lastLoadedUserTypeId === utid) return;
    this.lastLoadedUserTypeId = utid;

    this.formGroup.controls['roleId'].setValidators(Validators.required);
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.roleType,
      endpoint: API.ADMIN.USER.ROLE.ROLEBYUSERTYPE,
      params: { userTypeId: utid },
      force: false,
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: item.value?.toLowerCase(),
        mnemonic: item.mnemonic
      }))
    });

    this.formGroup.controls['roleId'].updateValueAndValidity();
    this.cdr.markForCheck();
  };

  protected override submitForm(): void {
    const rawValue = this.formGroup.getRawValue();
    const { userId, firstName, middleName, lastName, email, phoneNumber, isActive, userTypeId, roleId } = rawValue;

    let userRoleList: any[] = [];

    if (userTypeId && roleId) {
      userRoleList.push({ userTypeId, roleId, isActive: rawValue.roleIsActive });
    }

    let i = 1;
    while (rawValue[`userTypeId_${i}`] !== undefined) {
      userRoleList.push({
        userTypeId: rawValue[`userTypeId_${i}`],
        roleId: rawValue[`roleId_${i}`],
        isActive: rawValue[`roleIsActive_${i}`] ?? true
      });
      i++;
    }

    const body: User = {
      userId,
      firstName,
      middleName,
      lastName,
      email,
      phoneNumber,
      isActive,
      userRoleList
    };

    this.commonHelperService.saveWithEmailVerification({
      store: this.store,
      endpoint: API.ADMIN.USER.USERS.ADDUPDATE,
      payload: body,
      isSaveClickedSignal: this.isSaveClicked
    }).pipe(untilDestroyed(this)).subscribe();
  }

  protected override cancelRoute(): string[] {
    return ['admin', 'user', 'users'];
  }

  private getRoleRowConfig(index: number, uKey: string, rKey: string, aKey: string): any[] {
    return [
      {
        control: {
          ...getDropdownConfig(uKey, `${SYSTEM_CONST.LABELS.USER.USER_TYPE} ${index + 1}`, this.userTypeDropdownList()),
          isFloatLabel: false,
        },
        type: DynamicFormControlType.DropDown,
        class: 'col-sm-6 col-lg-4 col-xl-4',
      },
      {
        control: {
          ...getDropdownConfig(rKey, `${SYSTEM_CONST.LABELS.USER.ROLE} ${index + 1}`, []),
          isFloatLabel: false,
        },
        type: DynamicFormControlType.DropDown,
        class: 'col-sm-6 col-lg-4 col-xl-4',
      },
      {
        control: getSlideToggleConfig(aKey, SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE, undefined, undefined, (val: boolean) => this.onRoleIsActiveChange(val, uKey, aKey)),
        type: DynamicFormControlType.SlideToggle,
        class: 'col-sm-6 col-lg-4 col-xl-4',
      },
    ];
  }

  private finalizePatching(): void {
    this.cdr.detectChanges();
    setTimeout(() => this.isPatching = false, 100);
  }

  protected override patchForm(user: User): void {
    this.isPatching = true;

    if (!user.userRoleList || user.userRoleList.length === 0) {
      this.formGroup.patchValue(user as any, { emitEvent: false });
      FormUtils.disableDynamicFormFields(this.formGroup, this.formControls, ['email']);
      this.finalizePatching();
      return;
    }

    // Identify unique user types and trigger API calls
    const primaryUtid = user.userRoleList[0]?.userTypeId?.toLowerCase();
    const uniqueUserTypes = [...new Set(user.userRoleList.map(r => r.userTypeId?.toLowerCase()))].filter(Boolean);

    // Include the user type dropdown fetch in forkJoin so controls are built with populated options
    const userTypeFetch$ = this.dropdownStore.getDropdownObservable({
      key: this.DROPDOWN_KEYS.userType,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.UserTypeIds }
    });

    const roleApiCalls$ = uniqueUserTypes.map(utid => {
      const storeKey = utid === primaryUtid ? this.DROPDOWN_KEYS.roleType : `${this.DROPDOWN_KEYS.roleType}_${utid}`;
      return this.dropdownStore.getDropdownObservable({
        key: storeKey,
        endpoint: API.ADMIN.USER.ROLE.ROLEBYUSERTYPE,
        params: { userTypeId: utid },
        force: false,
        mapData: (items: any[]) => items.map(item => ({
          text: item.text,
          value: item.value?.toLowerCase(),
          mnemonic: item.mnemonic
        }))
      });
    });

    const apiCalls$ = [userTypeFetch$, ...roleApiCalls$];

    forkJoin(apiCalls$).pipe(
      untilDestroyed(this),
      finalize(() => this.finalizePatching())
    ).pipe(untilDestroyed(this)).subscribe(() => {
      // Identify and add dynamic controls
      const roleControls: any[] = [];
      const patchObj: any = { ...user };
      const toDisable: string[] = ['email'];

      user.userRoleList.forEach((role, i) => {
        const uKey = i === 0 ? 'userTypeId' : `userTypeId_${i}`;
        const rKey = i === 0 ? 'roleId' : `roleId_${i}`;
        const aKey = i === 0 ? 'roleIsActive' : `roleIsActive_${i}`;

        toDisable.push(uKey);

        // Add dynamic controls if they don't exist
        if (i > 0) {
          const group = this.formGroup as FormGroup;
          if (!group.contains(uKey)) {
            group.addControl(uKey, this.fb.nonNullable.control(role.userTypeId?.toLowerCase(), Validators.required));
          }
          if (!group.contains(rKey)) {
            group.addControl(rKey, this.fb.nonNullable.control(role.roleId?.toLowerCase(), Validators.required));
          }
          if (!group.contains(aKey)) {
            const control = this.fb.nonNullable.control(role.isActive ?? true);
              group.addControl(aKey, control);
          }
        }

        // Prepare patch data
        patchObj[uKey] = role.userTypeId?.toLowerCase();
        patchObj[rKey] = role.roleId?.toLowerCase();
        patchObj[aKey] = role.isActive ?? true;

        // Add to UI configuration
        roleControls.push(...this.getRoleRowConfig(i, uKey, rKey, aKey));
      });

      // Update the Role and Status section in the UI
      const sectionIndex = this.formControls.formSection.findIndex(s => s.title === SYSTEM_CONST.SECTIONS.ROLE_AND_STATUS);
      if (sectionIndex > -1) {
        this.formControls.formSection[sectionIndex].controls = roleControls;
      }

      this.formGroup.patchValue(patchObj, { emitEvent: false });
      FormUtils.disableDynamicFormFields(this.formGroup, this.formControls, toDisable);

      // Bind dropdown data and force value sync for dynamic controls
      user.userRoleList.forEach((role, i) => {
        const rKey = i === 0 ? 'roleId' : `roleId_${i}`;
        const storeKey = role.userTypeId?.toLowerCase() === primaryUtid ? this.DROPDOWN_KEYS.roleType : `${this.DROPDOWN_KEYS.roleType}_${role.userTypeId?.toLowerCase()}`;

        // Assign options to UI config
        const options = this.dropdownStore.getList(storeKey)();
        this.updateDropdownData(rKey, options);

      });
    });
  }
}

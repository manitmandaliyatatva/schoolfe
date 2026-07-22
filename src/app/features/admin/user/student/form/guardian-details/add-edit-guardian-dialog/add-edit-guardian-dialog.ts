import { ChangeDetectorRef, Component, effect, ElementRef, inject, OnInit, signal } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import CommonHelper from '../../../../../../../core/helpers/common-helper';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { REGEX_CONST } from '../../../../../../../core/constants/regex.constant';
import { FormUtils } from '../../../../../../../core/helpers/form-utils';
import { SYSTEM_CONST } from '../../../../../../../core/constants/system.constant';
import { CommonDropdownStore } from '../../../../../../../core/store/common-dropdown.store';
import { ButtonComponent } from '../../../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../../../shared/components/button/model/button.model';
import { CommonDropdownConfig } from '../../../../../../../shared/components/common-dropdown/model/common-dropdown.model';
import { DynamicFormComponent } from '../../../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { API } from '../../../../../../../shared/constants/api-url';
import { GuardianTypeConst } from '../../../../../../../shared/constants/guardian-type.constant';
import { UserTypeConst } from '../../../../../../../shared/constants/user-type.constants';
import { LookupMnemonics } from '../../../../../../../shared/constants/lookup-type-ids.constant';
import { InputType } from '../../../../../../../shared/Enums/common.enum';
import { getButtonConfig, getDropdownConfig, getSlideToggleConfig, getTextboxConfig } from '../../../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../../../shared/models/form-control-base.model';
import {
  AddEditGuardianDialogData,
  existingGuardianDetailsStore,
  Guardian,
  GuardianConst
} from '../../../models/guardian.model';
import { CommonHelperService } from '../../../../../../../core/services/common-helper.service';
import { EMPTY_GUID } from '../../../../../../../shared/constants/app.constants';
import { ConfirmationService } from '../../../../../../../shared/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'app-add-edit-guardian-dialog',
  imports: [ReactiveFormsModule, DynamicFormComponent, ButtonComponent],
  providers: [existingGuardianDetailsStore],
  templateUrl: './add-edit-guardian-dialog.html',
})
export class AddEditGuardianDialog implements OnInit {
  private static readonly DROPDOWN_KEYS = {
    roleType: 'guardianRoleType',
    existingGuardian: 'existingGuardian',
    guardianType: 'guardianType',
    guardianSubType: 'guardianSubType',
    userType: 'guardianUserType',
  } as const;

  private readonly elementRef = inject(ElementRef);

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<any, boolean>);
  private readonly dialogData = inject<AddEditGuardianDialogData>(MAT_DIALOG_DATA);
  readonly dropdownStore = inject(CommonDropdownStore);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly commonHelperService = inject(CommonHelperService);
  readonly confirmService = inject(ConfirmationService);
  readonly existingGuardianDetailsStore = inject(existingGuardianDetailsStore);
  readonly roleTypeDropdownList = this.dropdownStore.getList(AddEditGuardianDialog.DROPDOWN_KEYS.roleType);
  readonly existingGuardianDropdownList = this.dropdownStore.getList(AddEditGuardianDialog.DROPDOWN_KEYS.existingGuardian);
  readonly guardianTypeDropdownList = this.dropdownStore.getList(AddEditGuardianDialog.DROPDOWN_KEYS.guardianType);
  readonly guardianSubTypeDropdownList = this.dropdownStore.getList(AddEditGuardianDialog.DROPDOWN_KEYS.guardianSubType);
  readonly userTypeDropdownList = this.dropdownStore.getList(AddEditGuardianDialog.DROPDOWN_KEYS.userType);

  formGroup = this.fb.group({
    guardianId: this.fb.control<string | null>(EMPTY_GUID),
    studentId: this.fb.control<string | null>(EMPTY_GUID),
    useExistingGuardian: this.fb.control(false),
    existingGuardianId: this.fb.control<string | null>(EMPTY_GUID),
    firstName: this.fb.control(null, [Validators.required, Validators.maxLength(100), FormUtils.onlyStringNoSpace]),
    middleName: this.fb.control(null, [Validators.required, Validators.maxLength(100), FormUtils.onlyStringNoSpace]),
    lastName: this.fb.control(null, [Validators.required, Validators.maxLength(100), FormUtils.onlyStringNoSpace]),
    email: this.fb.control(null, [Validators.required, Validators.email, Validators.pattern(REGEX_CONST.EMAIL), Validators.maxLength(255)]),
    phoneNumber: this.fb.control(null, Validators.required),
    occupation: this.fb.control('', [Validators.maxLength(100)]),
    address: this.fb.control('', [Validators.maxLength(500)]),
    photo: this.fb.control(null),
    guardianType: this.fb.control(null, Validators.required),
    guardianSubType: this.fb.control(null, Validators.required),
    userId: this.fb.control<string | null>(EMPTY_GUID),
    userTypeId: this.fb.control<string | null>(UserTypeConst.Parent),
    roleId: this.fb.control<string | null>(EMPTY_GUID),
    isActAsUser: this.fb.control(false),
    isActive: this.fb.control(true),
  });

  formControls!: DynamicForm;
  private roleTypeOptions: ITextValueOption[] = [];
  private guardianTypeOptions: ITextValueOption[] = [];
  private guardianSubTypeOptions: ITextValueOption[] = [];
  private userTypeOptions: ITextValueOption[] = [];
  readonly existingGuardianOptions = signal<ITextValueOption[]>([]);
  readonly isExistingGuardianDetailsLoading = signal(false);
  readonly isAddMode = signal(true);

  readonly saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onSave(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true),
    cssClasses: ['btn', 'primary-btn'],
  });

  readonly cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn'],
  });

  constructor() {
    effect(() => {
      const options = this.roleTypeDropdownList();
      this.roleTypeOptions = options;
      this.updateDropdownData('roleId', options);
    });

    effect(() => {
      const options = this.guardianTypeDropdownList();
      this.guardianTypeOptions = options;
      this.updateDropdownData('guardianType', this.getAvailableGuardianTypes());
    });

    effect(() => {
      const options = this.guardianSubTypeDropdownList();
      this.guardianSubTypeOptions = options;
      this.updateDropdownData('guardianSubType', options);
    });

    effect(() => {
      const options = this.userTypeDropdownList();
      this.userTypeOptions = options;
      this.updateDropdownData('userTypeId', options);
    });

    effect(() => {
      const options = this.existingGuardianDropdownList() ?? [];
      this.existingGuardianOptions.set(Array.isArray(options) ? options : []);
      if (!options.length) {
        this.formGroup.controls.existingGuardianId.setValue(null, { emitEvent: false });
      }
      this.setFormControls();
    });

    effect(() => {
      const isLoading = this.existingGuardianDetailsStore.isLoading();
      this.isExistingGuardianDetailsLoading.set(isLoading);

      if (isLoading) {
        this.setFormControls();
        return;
      }

      const details = this.existingGuardianDetailsStore.data();
      if (details && this.formGroup.controls.useExistingGuardian.value) {
        this.patchExistingGuardianDetails(details);
        return;
      }

      this.setFormControls();
    });
  }

  ngOnInit(): void {
    this.loadDropdownOptions();
    this.syncGuardianSubTypeValidators();
    this.syncIsActAsUserValidators();
    this.setFormControls();

    const incomingGuardian = this.data.guardian;
    const isEditMode = !!incomingGuardian && !CommonHelper.isEmpty(incomingGuardian.guardianId);
    this.isAddMode.set(!isEditMode);

    if (incomingGuardian) {
      this.formGroup.patchValue({
        ...incomingGuardian,
        studentId: this.data.studentId || incomingGuardian.studentId || null,
      }, { emitEvent: false });
      if (!incomingGuardian.isNew && incomingGuardian.isActAsUser) {
        this.formGroup.controls.email.disable();
      }
      this.syncGuardianSubTypeValidators();
      this.syncIsActAsUserValidators();
      this.setFormControls();
      this.formGroup.markAsPristine();
    } else {
      this.syncIsActAsUserValidators();
      this.formGroup.patchValue({ studentId: CommonHelper.resolveId(this.data.studentId) }, { emitEvent: false });
      this.formGroup.markAsPristine();
    }
  }

  onUseExistingGuardianToggle = (isChecked: boolean): void => {
    if (!this.isAddMode()) return;
    if (!isChecked) {
      this.formGroup.controls.existingGuardianId.setValue(null, { emitEvent: false });
      this.formGroup.controls.email.enable({ emitEvent: false });
      this.existingGuardianDetailsStore.resetState();
      this.existingGuardianOptions.set([]);
      this.clearGuardianFormFields();
      this.setFormControls();
      return;
    }

    this.formGroup.controls.email.disable({ emitEvent: false });
    this.loadExistingGuardianOptions();
    this.setFormControls();
  };

  private readonly onIsActAsUserChange = (isActAsUser: boolean): void => {
    if (isActAsUser === false && !this.isAddMode() && this.data.guardian?.isActAsUser) {
      const name = this.formGroup.controls.firstName.value || '';
      this.confirmService.confirmUserAction('inactivate', name, 'role', 'Guardian')
        .pipe(untilDestroyed(this))
        .subscribe((confirmed) => {
          if (!confirmed) {
            this.formGroup.controls.isActAsUser.setValue(true, { emitEvent: false });
          } else {
            this.syncIsActAsUserValidators();
            this.setFormControls();
          }
        });
    } else {
      this.syncIsActAsUserValidators();
      this.setFormControls();
    }
  };

  private readonly onIsActiveChange = (isActive: boolean): void => {
    if (isActive === false && !this.isAddMode() && this.data.guardian?.isActive) {
      const name = this.formGroup.controls.firstName.value || '';
      this.confirmService.confirmUserAction('inactivate', name, 'user', 'Guardian')
        .pipe(untilDestroyed(this))
        .subscribe((confirmed) => {
          if (!confirmed) {
            this.formGroup.controls.isActive.setValue(true, { emitEvent: false });
          }
        });
    }
  };

  onSave = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.commonHelperService.scrollToInvalidController(this.elementRef.nativeElement.parentElement)
      return;
    }

    const formValue = this.formGroup.getRawValue();
    const payload: Guardian = {
      ...formValue,
      studentId: CommonHelper.resolveId(this.data.studentId ?? formValue.studentId),
      guardianId: CommonHelper.resolveId(formValue.guardianId),
      userId: CommonHelper.resolveId(formValue.userId),
      roleId: CommonHelper.resolveId(formValue.roleId),
      guardianType: Number(formValue.guardianType ?? 0),
      guardianSubType: Number(formValue.guardianSubType ?? 0),
    } as Guardian;

    this.data.onSave?.(payload);
    this.dialogRef.close(true);
  };

  onCancel = (): void => {
    this.dialogRef.close(false);
  };

  private onExistingGuardianSelect = (selection: ITextValueOption): void => {
    if (!this.isAddMode() || !this.formGroup.controls.useExistingGuardian.value) return;

    const selectedGuardianId = selection?.value?.toString() || null;
    if (CommonHelper.isEmpty(selectedGuardianId)) {
      this.formGroup.controls.email.disable({ emitEvent: false });
      this.existingGuardianDetailsStore.resetState();
      this.clearGuardianFormFields();
      this.setFormControls();
      return;
    }

    this.existingGuardianDetailsStore.getById({
      endpoint: API.ADMIN.USER.GUARDIAN.GETBYID,
      params: { guardianId: selectedGuardianId },
    });
  };

  private loadExistingGuardianOptions = (): void => {
    this.dropdownStore.getDropdown({
      key: AddEditGuardianDialog.DROPDOWN_KEYS.existingGuardian,
      endpoint: API.ADMIN.USER.GUARDIAN.EXISTINGGUARDIANDROPDOWN,
      params: { studentId: CommonHelper.resolveId(this.data.studentId) },
    });
  };

  private loadDropdownOptions = (): void => {
    this.dropdownStore.getDropdown({
      key: AddEditGuardianDialog.DROPDOWN_KEYS.guardianType,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.GuardianType },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
    });
    this.dropdownStore.getDropdown({
      key: AddEditGuardianDialog.DROPDOWN_KEYS.guardianSubType,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.GuardianSubType },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
    });
    this.dropdownStore.getDropdown({
      key: AddEditGuardianDialog.DROPDOWN_KEYS.userType,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.UserTypeIds }
    });
  };

  private patchExistingGuardianDetails = (details: Guardian | null): void => {
    if (!details) return;

    this.formGroup.patchValue({
      ...details,
      guardianId: details.guardianId,
      guardianType: null,
      guardianSubType: null,
      userTypeId: (details.userTypeId ?? UserTypeConst.Parent)?.toLowerCase(),
      isActAsUser: !!details.isActAsUser,
      isActive: details.isActive ?? true,
    }, { emitEvent: false });

    const availableTypes = this.getAvailableGuardianTypes();
    if (availableTypes.length === 1) {
      this.formGroup.patchValue({ guardianType: Number(availableTypes[0].value) }, { emitEvent: false });
    }

    if (this.formGroup.controls.useExistingGuardian.value) {
      this.formGroup.controls.email.disable({ emitEvent: false });
    }

    this.syncGuardianSubTypeValidators();
    this.syncIsActAsUserValidators();
    this.setFormControls();
  };

  private get data(): AddEditGuardianDialogData {
    return this.dialogData ?? { studentId: null };
  }

  private setFormControls = (): void => {
    const usedGuardianIds = this.data.existingGuardians
      ?.filter(g => !g.isDeleted && !CommonHelper.isEmpty(g.guardianId) && g.rowKey !== this.data.guardian?.rowKey)
      .map(g => g.guardianId) ?? [];

    const existingGuardianSection = {
      title: GuardianConst.EXISTING_GUARDIAN,
      isHiddenSection: () => !this.isAddMode(),
      controls: [
        {
          control: getSlideToggleConfig(
            'useExistingGuardian',
            GuardianConst.USE_EXISTING_GUARDIAN,
            'after',
            'primary',
            (checked: boolean) => this.onUseExistingGuardianToggle(checked)
          ),
          type: DynamicFormControlType.SlideToggle,
          class: 'col-12 col-md-6',
        },
        {
          control: {
            ...getDropdownConfig(
              'existingGuardianId',
              GuardianConst.EXISTING_GUARDIAN,
              this.existingGuardianOptions(),
              {
                allowClear: true,
                allowSearching: true,
                excludeCallback: (item) => usedGuardianIds.includes(item.value?.toString() || ''),
              },
              [],
              (selection) => this.onExistingGuardianSelect(selection as ITextValueOption)
            ),
            isFloatLabel: false,
          },
          type: DynamicFormControlType.DropDown,
          class: 'col-12 col-md-6',
          isHiddenField: () => !this.formGroup.controls.useExistingGuardian.value,
        },
      ],
    };

    this.formControls = {
      formSection: [
        existingGuardianSection,
        {
          title: SYSTEM_CONST.SECTIONS.GUARDIAN_INFO,
          controls: [
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.FIRST_NAME, 'firstName', undefined, InputType.text),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.MIDDLE_NAME, 'middleName', undefined, InputType.text),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.LAST_NAME, 'lastName', undefined, InputType.text),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.EMAIL, 'email', undefined, InputType.email),
              type: DynamicFormControlType.Email,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.PHONE_NUMBER, 'phoneNumber', undefined, InputType.contactNumber),
              type: DynamicFormControlType.ContactNumber,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.OCCUPATION, 'occupation', undefined, InputType.text),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.ADDRESS, 'address', undefined, InputType.text),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getDropdownConfig('guardianType', SYSTEM_CONST.LABELS.USER.GUARDIAN_TYPE, this.getAvailableGuardianTypes(), null, null, () => {
                  this.syncGuardianSubTypeValidators();
                  this.setFormControls();
                }),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getDropdownConfig('guardianSubType', SYSTEM_CONST.LABELS.USER.GUARDIAN_SUB_TYPE, this.guardianSubTypeOptions),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
              isHiddenField: () => this.formGroup.controls.guardianType.value !== GuardianTypeConst.Other,
            },
          ],
        },
        {
          title: SYSTEM_CONST.SECTIONS.ROLE_AND_STATUS,
          controls: [
            {
              control: getSlideToggleConfig(
                'isActAsUser',
                GuardianConst.IS_ACT_AS_USER,
                'after',
                'primary',
                (checked: boolean) => this.onIsActAsUserChange(checked)
              ),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
            {
              control: getSlideToggleConfig(
                'isActive', 
                SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE,
                undefined,
                undefined,
                (checked: boolean) => this.onIsActiveChange(checked)
              ),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
            {
              control: {
                ...getDropdownConfig('userTypeId', SYSTEM_CONST.LABELS.USER.USER_TYPE, this.userTypeOptions, { isDisable: true }),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
              isHiddenField: () => !this.formGroup.controls.isActAsUser.value,
            },
            {
              control: {
                ...getDropdownConfig('roleId', SYSTEM_CONST.LABELS.USER.ROLE, this.roleTypeOptions),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
              isHiddenField: () => !this.formGroup.controls.isActAsUser.value,
            },
          ],
        },
      ],
    };
  };

  private syncGuardianSubTypeValidators = (): void => {
    const subTypeControl = this.formGroup.controls.guardianSubType;
    const isOtherGuardianType = this.formGroup.controls.guardianType.value === GuardianTypeConst.Other;

    subTypeControl.clearValidators();
    if (isOtherGuardianType) {
      subTypeControl.addValidators([Validators.required]);
    } else {
      subTypeControl.setValue(null, { emitEvent: false });
    }
    subTypeControl.updateValueAndValidity({ emitEvent: false });
  };

  private getAvailableGuardianTypes = (): ITextValueOption[] => {
    const existing = this.data.existingGuardians?.filter(g =>
      !g.isDeleted && g.rowKey !== this.data.guardian?.rowKey
    ) ?? [];

    const fatherCount = existing.filter(g => g.guardianType === GuardianTypeConst.Father).length;
    const motherCount = existing.filter(g => g.guardianType === GuardianTypeConst.Mother).length;
    const otherCount = existing.filter(g => g.guardianType === GuardianTypeConst.Other).length;

    return this.guardianTypeOptions.filter(opt => {
      const val = Number(opt.value);
      if (val === GuardianTypeConst.Father || opt.mnemonic === 'FATHR') return fatherCount < 1;
      if (val === GuardianTypeConst.Mother || opt.mnemonic === 'MOTHR') return motherCount < 1;
      if (val === GuardianTypeConst.Other || opt.mnemonic === 'OTHER') return otherCount < 3;
      return true;
    });
  };

  private syncIsActAsUserValidators = (): void => {
    const roleIdControl = this.formGroup.controls.roleId;
    const userTypeIdControl = this.formGroup.controls.userTypeId;
    const isActAsUser = this.formGroup.controls.isActAsUser.value;

    roleIdControl.clearValidators();
    userTypeIdControl.clearValidators();

    if (isActAsUser) {
      roleIdControl.addValidators([Validators.required]);
      userTypeIdControl.addValidators([Validators.required]);
      if (CommonHelper.isEmpty(userTypeIdControl.value)) {
        userTypeIdControl.setValue(UserTypeConst.Parent, { emitEvent: false });
      }
    } else {
      roleIdControl.setValue(null, { emitEvent: false });
      userTypeIdControl.setValue(null, { emitEvent: false });
    }

    roleIdControl.updateValueAndValidity({ emitEvent: false });
    userTypeIdControl.updateValueAndValidity({ emitEvent: false });
  };

  private clearGuardianFormFields = (): void => {
    this.formGroup.patchValue({
      guardianId: EMPTY_GUID,
      studentId: this.data.studentId ?? EMPTY_GUID,
      useExistingGuardian: this.formGroup.controls.useExistingGuardian.value ?? false,
      existingGuardianId: this.formGroup.controls.existingGuardianId.value ?? null,
      userId: EMPTY_GUID,
      userTypeId: UserTypeConst.Parent,
      roleId: EMPTY_GUID,
    }, { emitEvent: false });

    this.syncGuardianSubTypeValidators();
    this.syncIsActAsUserValidators();
  };

  private updateDropdownData = (formControlName: string, options: ITextValueOption[]): void => {
    if (!this.formControls?.formSection?.length) return;
    this.formControls = {
      formSection: this.formControls.formSection.map((section) => ({
        ...section,
        controls: section.controls.map((control) => {
          if (control.type !== DynamicFormControlType.DropDown) return control;
          const dropdownControl = control.control as CommonDropdownConfig;
          if (dropdownControl.formControlName !== formControlName) return control;
          return {
            ...control,
            control: {
              ...dropdownControl,
              data: [...options],
            },
          };
        }),
      })),
    };
    this.cdr.detectChanges();
  };

}

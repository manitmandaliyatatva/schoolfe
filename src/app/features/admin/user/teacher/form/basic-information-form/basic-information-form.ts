import { ChangeDetectorRef, Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { REGEX_CONST } from '../../../../../../core/constants/regex.constant';
import { FormUtils } from '../../../../../../core/helpers/form-utils';
import { CommonHelperService } from '../../../../../../core/services/common-helper.service';
import CommonHelper from '../../../../../../core/helpers/common-helper';
import { CommonDropdownStore } from '../../../../../../core/store/common-dropdown.store';
import { DynamicFormComponent } from '../../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { API } from '../../../../../../shared/constants/api-url';
import { UserTypeConst } from '../../../../../../shared/constants/user-type.constants';
import { LookupMnemonics } from '../../../../../../shared/constants/lookup-type-ids.constant';
import { InputType } from '../../../../../../shared/Enums/common.enum';
import { getTextboxConfig, getDatePickerConfig, getDropdownConfig, getSlideToggleConfig, getRadioButtonConfig } from '../../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../../shared/models/form-control-base.model';
import { teacherStore, Teacher } from '../../models/teacher.model';
import { ITextValueOption } from '../../../../../../shared/models/common.model';
import { CommonDropdownConfig } from '../../../../../../shared/components/common-dropdown/model/common-dropdown.model';
import { CommonRadioButtonConfig } from '../../../../../../shared/components/common-radio-button/models/common-radio-button.model';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { EMPTY_GUID } from '../../../../../../shared/constants/app.constants';
import { AcademicYearHelperService } from '../../../../../../core/services/academic-year-helper.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { BaseSaveResponse } from '../../../../../../core/models/email-validation.model';
import { ConfirmationService } from '../../../../../../shared/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'app-teacher-basic-info-form',
  standalone: true,
  imports: [DynamicFormComponent, ReactiveFormsModule, MatButtonModule, MatIconModule],
  providers: [teacherStore],
  templateUrl: './basic-information-form.html'
})
export class TeacherBasicInfoForm implements OnInit, OnDestroy {
  private static readonly DROPDOWN_KEYS = {
    classSubject: 'classSubject',
    roleType: 'roleType',
    gender: 'gender',
    contractType: 'contractType',
    shift: 'shift',
    userType: 'userType',
  };

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  readonly teacherStore = inject(teacherStore);
  readonly dropdownStore = inject(CommonDropdownStore);
  readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly confirmService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly classSubjectDropdownList = this.dropdownStore.getList(TeacherBasicInfoForm.DROPDOWN_KEYS.classSubject);
  readonly roleTypeDropdownList = this.dropdownStore.getList(TeacherBasicInfoForm.DROPDOWN_KEYS.roleType);
  readonly genderOptionsList = this.dropdownStore.getList(TeacherBasicInfoForm.DROPDOWN_KEYS.gender);
  readonly contractTypeOptionsList = this.dropdownStore.getList(TeacherBasicInfoForm.DROPDOWN_KEYS.contractType);
  readonly shiftOptionsList = this.dropdownStore.getList(TeacherBasicInfoForm.DROPDOWN_KEYS.shift);
  readonly userTypeOptionsList = this.dropdownStore.getList(TeacherBasicInfoForm.DROPDOWN_KEYS.userType);

  private readonly editTeacherId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.editTeacherId() !== null);

  formGroup = this.fb.group({
    teacherId: this.fb.control<string | null>(EMPTY_GUID),
    userId: this.fb.control<string | null>(EMPTY_GUID),
    userTypeId: this.fb.control(UserTypeConst.Teacher),
    roleId: this.fb.control(null, Validators.required),
    teacherCode: this.fb.control({ value: null, disabled: true }),
    firstName: this.fb.control(null, [Validators.required, FormUtils.onlyStringNoSpace]),
    middleName: this.fb.control(null, [Validators.required, FormUtils.onlyStringNoSpace]),
    lastName: this.fb.control(null, [Validators.required, FormUtils.onlyStringNoSpace]),
    fullName: this.fb.control(null),
    email: this.fb.control(null, [Validators.required, Validators.pattern(REGEX_CONST.EMAIL)]),
    phoneNumber: this.fb.control(null, Validators.required),
    dob: this.fb.control(null, Validators.required),
    gender: this.fb.control(null, Validators.required),
    photo: this.fb.control(null, Validators.required),
    photoName: this.fb.control<string | null>(null),
    isPhotoReplaced: this.fb.control<boolean>(false),
    joiningDate: this.fb.control(null, Validators.required),
    experienceYears: this.fb.control(null, [Validators.required, Validators.min(0)]),
    workLocation: this.fb.control(null, Validators.required),
    classSubjectId: this.fb.control(null, Validators.required),
    currentAddress: this.fb.control(null, [Validators.required, Validators.maxLength(500)]),
    permanentAddress: this.fb.control(null, [Validators.required, Validators.maxLength(500)]),
    contractType: this.fb.control(null, Validators.required),
    shift: this.fb.control(null, Validators.required),
    isActive: this.fb.control(true),
  });

  formControls!: DynamicForm;
  private classSubjectOptions: ITextValueOption[] = [];
  private roleTypeOptions: ITextValueOption[] = [];
  private genderOptions: ITextValueOption[] = [];
  private contractTypeOptions: ITextValueOption[] = [];
  private shiftOptions: ITextValueOption[] = [];
  private userTypeOptions: ITextValueOption[] = [];

  constructor() {
    effect(() => {
      if (!this.isEditMode()) return;
      const teacherData = this.teacherStore.data();
      if (!teacherData) return;
      this.patchForm(teacherData);
    });

    this.bindDropdownToControl('classSubjectId', this.classSubjectDropdownList, (options) => {
      this.classSubjectOptions = options;
    });
    this.bindDropdownToControl('roleId', this.roleTypeDropdownList, (options) => {
      this.roleTypeOptions = options;
    });
    this.bindDropdownToControl('gender', this.genderOptionsList, (options) => {
      this.genderOptions = options;
    });
    this.bindDropdownToControl('contractType', this.contractTypeOptionsList, (options) => {
      this.contractTypeOptions = options;
    });
    this.bindDropdownToControl('shift', this.shiftOptionsList, (options) => {
      this.shiftOptions = options;
    });
    this.bindDropdownToControl('userTypeId', this.userTypeOptionsList, (options) => {
      this.userTypeOptions = options;
    });
  }

  private bindDropdownToControl = (
    formControlName: string,
    source: () => ITextValueOption[],
    assign: (options: ITextValueOption[]) => void,
    afterAssign?: () => void
  ): void => {
    effect(() => {
      const options = source();
      assign(options);
      this.updateDropdownData(formControlName, options);
      afterAssign?.();
    });
  };

  ngOnInit(): void {
    this.teacherStore.resetState();

    this.resolveEditMode();
    this.setFormControls();
    this.loadDropdownOptions();
  }

  ngOnDestroy(): void {
    this.dropdownStore.resetState();
  }

  private readonly onIsActiveChange = (isActive: boolean): void => {
    if (isActive === false && this.isEditMode()) {
      const name = this.formGroup.controls.fullName.value || this.formGroup.controls.firstName.value || '';
      this.confirmService.confirmUserAction('inactivate', name, 'account', 'Teacher').pipe(untilDestroyed(this)).subscribe((confirmed) => {
        if (!confirmed) {
          this.formGroup.controls.isActive.setValue(true, { emitEvent: false });
        }
      });
    }
  };

  private setFormControls = (): void => {
    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.PERSONAL,
          controls: [
            {
              control: {
                formControlName: 'photo',
                label: SYSTEM_CONST.LABELS.DOCUMENTS.TEACHER_PHOTO,
                altText: SYSTEM_CONST.LABELS.DOCUMENTS.TEACHER_PHOTO,
                fileType : 'image',
                allowedExtensions : ['.jpeg','.jpg','.png'],
                change: (base64: string, fileName?: string) => {
                  if (fileName)
                    this.formGroup.patchValue({ photoName: fileName });
                  if (this.isEditMode())
                    this.formGroup.patchValue({ isPhotoReplaced: true });
                }
              },
              type: DynamicFormControlType.ImageUpload,
              class: 'col-12',
            },
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
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.PHONE_NUMBER, 'phoneNumber', undefined, InputType.contactNumber),
              type: DynamicFormControlType.ContactNumber,
              class: 'col-12 col-md-6',
            },
            {
              control: getDatePickerConfig(
                'dob',
                SYSTEM_CONST.LABELS.COMMON.DOB,
                undefined,
                undefined,
                () => CommonHelper.getDateByYear(100),
                () => CommonHelper.getDateByYear(0),
                () => {
                  this.formGroup.controls.joiningDate.updateValueAndValidity();
                }
              ),
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4',
            },
            {
              control: getRadioButtonConfig('gender', SYSTEM_CONST.LABELS.COMMON.GENDER, this.genderOptions),
              type: DynamicFormControlType.Radiobutton,
              class: 'col-sm-6 col-lg-4 col-xl-4',
            },
          ],
        },
        {
          title: SYSTEM_CONST.SECTIONS.ADDRESS,
          controls: [
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.ADDRESS.CURRENT, 'currentAddress', undefined, InputType.text),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.ADDRESS.PERMANENT, 'permanentAddress', undefined, InputType.text),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            }
          ]
        },
        {
          title: SYSTEM_CONST.SECTIONS.CLASS,
          controls: [
            {
              control: {
                ...getDropdownConfig('classSubjectId', SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT, this.classSubjectOptions),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.ACADEMIC.TEACHER_CODE, 'teacherCode', undefined, InputType.text),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
              isHiddenField: () => !this.isEditMode()
            },
          ],
        },
        {
          title: SYSTEM_CONST.SECTIONS.PROFESSIONAL,
          controls: [
            {
              control: {
                ...getDropdownConfig('contractType', SYSTEM_CONST.LABELS.ACADEMIC.CONTRACT, this.contractTypeOptions),
                isFloatLabel: false
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDropdownConfig('shift', SYSTEM_CONST.LABELS.ACADEMIC.SHIFT, this.shiftOptions),
                isFloatLabel: false
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.ACADEMIC.LOCATION, 'workLocation', undefined, InputType.text),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getDatePickerConfig(
                'joiningDate',
                SYSTEM_CONST.LABELS.ACADEMIC.JOINING_DATE,
                undefined,
                undefined,
                () => CommonHelper.getMinDateAfter(1, this.formGroup.controls.dob.value),
                () => CommonHelper.getDateByYear(-1)
              ),
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.ACADEMIC.EXPERIENCE, 'experienceYears', undefined, InputType.number),
              type: DynamicFormControlType.Number,
              class: 'col-12 col-md-4',
            },
          ]
        },
        {
          title: SYSTEM_CONST.SECTIONS.ROLE_AND_STATUS,
          controls: [
            {
              control: {
                ...getDropdownConfig('userTypeId', SYSTEM_CONST.LABELS.USER.USER_TYPE, this.userTypeOptions, { isDisable: true }),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDropdownConfig('roleId', SYSTEM_CONST.LABELS.USER.ROLE, this.roleTypeOptions),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE, undefined, undefined, this.onIsActiveChange),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-4 col-xl-4',
            },
          ]
        }
      ],
    };
  };

  private updateDropdownData = (formControlName: string, options: ITextValueOption[]): void => {
    if (!this.formControls?.formSection?.length) return;
    this.formControls = {
      formSection: this.formControls.formSection.map((section) => ({
        ...section,
        controls: section.controls.map((control) => {
          if (control.type !== DynamicFormControlType.DropDown && control.type !== DynamicFormControlType.Radiobutton) return control;
          if (control.type === DynamicFormControlType.DropDown) {
            const dropdownControl = control.control as CommonDropdownConfig;
            if (dropdownControl.formControlName !== formControlName) return control;
            return {
              ...control,
              control: {
                ...dropdownControl,
                data: [...options],
              },
            };
          } else {
            const radioControl = control.control as CommonRadioButtonConfig;
            if (radioControl.formControlName !== formControlName) return control;
            return {
              ...control,
              control: {
                ...radioControl,
                options: [...options],
              },
            };
          }
        }),
      })),
    };
    this.cdr.detectChanges();
  };

  private loadDropdownOptions = (): void => {
    this.dropdownStore.getDropdown({
      key: TeacherBasicInfoForm.DROPDOWN_KEYS.classSubject,
      endpoint: API.CLASS.CLASS_SUBJECT_DROPDOWN,
    });
    this.dropdownStore.getDropdown({
      key: TeacherBasicInfoForm.DROPDOWN_KEYS.roleType,
      endpoint: API.ADMIN.USER.ROLE.ROLEBYUSERTYPE,
      params: { userTypeId: UserTypeConst.Teacher }
    });
    this.dropdownStore.getDropdown({
      key: TeacherBasicInfoForm.DROPDOWN_KEYS.gender,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.Gender },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
    });
    this.dropdownStore.getDropdown({
      key: TeacherBasicInfoForm.DROPDOWN_KEYS.contractType,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.ContractType },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
    });
    this.dropdownStore.getDropdown({
      key: TeacherBasicInfoForm.DROPDOWN_KEYS.shift,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.Shift },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
    });
    this.dropdownStore.getDropdown({
      key: TeacherBasicInfoForm.DROPDOWN_KEYS.userType,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.UserTypeIds }
    });
  };

  onSave = (): void => {
    if (!this.formGroup.dirty || this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const payload = this.formGroup.getRawValue() as Teacher;
    const isSaveClickedSignal = signal<boolean>(false);

    this.commonHelperService.saveWithEmailVerification({
      store: this.teacherStore,
      endpoint: API.ADMIN.USER.TEACHER.ADDUPDATE,
      payload,
      isSaveClickedSignal: isSaveClickedSignal
    }).pipe(untilDestroyed(this)).subscribe();
  };

  saveWithResult = (): Observable<BaseSaveResponse | null> => {
    const payload = this.formGroup.getRawValue() as Teacher;
    return this.commonHelperService.saveWithEmailVerification<Teacher, BaseSaveResponse>({
      store: this.teacherStore,
      endpoint: API.ADMIN.USER.TEACHER.ADDUPDATE,
      payload
    });
  };

  private resolveEditMode = (): void => {
    const teacherIdParam = this.route.snapshot.paramMap.get('teacherId');
    if (CommonHelper.isEmpty(teacherIdParam)) return;

    this.editTeacherId.set(teacherIdParam);
    this.formGroup.controls.email.disable();
    this.teacherStore.getById({
      endpoint: API.ADMIN.USER.TEACHER.GET,
      params: { teacherId: teacherIdParam },
    });
  };

  private patchForm = (teacher: Teacher): void => {
    this.formGroup.patchValue({
      ...teacher,
      userTypeId: teacher.userTypeId?.toLowerCase(),
      roleId: teacher.roleId?.toLowerCase(),
      dob: teacher.dob ? CommonHelper.toDateOnly(teacher.dob) : null,
      joiningDate: teacher.joiningDate ? CommonHelper.toDateOnly(teacher.joiningDate) : CommonHelper.toDateOnly(new Date()),
    }, { emitEvent: false });
  };
}


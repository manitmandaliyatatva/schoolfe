import { ChangeDetectorRef, Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { REGEX_CONST } from '../../../../../../core/constants/regex.constant';
import { FormUtils } from '../../../../../../core/helpers/form-utils';
import CommonHelper from '../../../../../../core/helpers/common-helper';
import { CommonDropdownStore } from '../../../../../../core/store/common-dropdown.store';
import { CommonDropdownConfig } from '../../../../../../shared/components/common-dropdown/model/common-dropdown.model';
import { DynamicFormComponent } from '../../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { API } from '../../../../../../shared/constants/api-url';
import { UserTypeConst } from '../../../../../../shared/constants/user-type.constants';
import { LookupMnemonics } from '../../../../../../shared/constants/lookup-type-ids.constant';
import { InputType } from '../../../../../../shared/Enums/common.enum';
import { getTextboxConfig, getDatePickerConfig, getDropdownConfig, getSlideToggleConfig, getRadioButtonConfig } from '../../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../../shared/models/form-control-base.model';
import { studentStore, Student } from '../../models/student.model';
import { AcademicYearDropdown } from '../../../../configuration/academic-year/models/academic-year.model';
import { CommonRadioButtonConfig } from '../../../../../../shared/components/common-radio-button/models/common-radio-button.model';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { Observable } from 'rxjs';
import { EMPTY_GUID } from '../../../../../../shared/constants/app.constants';
import { AcademicYearHelperService } from '../../../../../../core/services/academic-year-helper.service';
import { CommonHelperService } from '../../../../../../core/services/common-helper.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BaseSaveResponse } from '../../../../../../core/models/email-validation.model';
import { ConfirmationService } from '../../../../../../shared/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'app-basic-information-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, MatButtonModule, MatIconModule],
  providers: [studentStore],
  templateUrl: './basic-information-form.html',
})
export class BasicInformationForm implements OnInit, OnDestroy {
  private static readonly DROPDOWN_KEYS = {
    category: 'studentCategory',
    classSection: 'classSectionList',
    academicYear: 'academicYearList',
    roleType: 'roleType',
    gender: 'gender',
    userType: 'userType',
  };

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly studentStore = inject(studentStore);
  readonly dropdownStore = inject(CommonDropdownStore);
  readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly confirmService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly categoryDropdownList = this.dropdownStore.getList(BasicInformationForm.DROPDOWN_KEYS.category);
  readonly classSectionDropdownList = this.dropdownStore.getList(BasicInformationForm.DROPDOWN_KEYS.classSection);
  readonly academicYearDropdownList = this.dropdownStore.getList(BasicInformationForm.DROPDOWN_KEYS.academicYear);
  readonly roleTypeDropdownList = this.dropdownStore.getList(BasicInformationForm.DROPDOWN_KEYS.roleType);
  readonly genderOptionsList = this.dropdownStore.getList(BasicInformationForm.DROPDOWN_KEYS.gender);
  readonly userTypeOptionsList = this.dropdownStore.getList(BasicInformationForm.DROPDOWN_KEYS.userType);

  private readonly editStudentId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.editStudentId() !== null);
  readonly isSaveClicked = signal<boolean>(false);
  private defaultAcademicYearId: string | null = null;

  formGroup = this.fb.group({
    studentId: this.fb.control<string | null>(EMPTY_GUID),
    userId: this.fb.control<string | null>(EMPTY_GUID),
    userTypeId: this.fb.control(UserTypeConst.Student),
    roleId: this.fb.control({ value: null, disabled: true }, Validators.required),
    classSectionId: this.fb.control(null, Validators.required),
    rollNumber: this.fb.control(null, Validators.required),
    admissionNumber: this.fb.control({ value: null, disabled: true }),
    firstName: this.fb.control(null, [Validators.required, FormUtils.onlyStringNoSpace]),
    middleName: this.fb.control(null, [Validators.required, FormUtils.onlyStringNoSpace]),
    lastName: this.fb.control(null, [Validators.required, FormUtils.onlyStringNoSpace]),
    fullName: this.fb.control(''),
    categoryId: this.fb.control(null, Validators.required),
    categoryName: this.fb.control(''),
    gender: this.fb.control(null, Validators.required),
    dob: this.fb.control(null, Validators.required),
    phoneNumber: this.fb.control(null, Validators.required),
    photo: this.fb.control(null, Validators.required),
    photoName: this.fb.control<string | null>(null),
    isPhotoReplaced: this.fb.control<boolean>(false),
    admissionDate: this.fb.control(null, Validators.required),
    currentAcademicYearId: this.fb.control(null, Validators.required),
    email: this.fb.control(null, [Validators.required, Validators.email, Validators.pattern(REGEX_CONST.EMAIL)]),
    currentAddress: this.fb.control(null, [Validators.required, Validators.maxLength(500)]),
    permanentAddress: this.fb.control(null, [Validators.required, Validators.maxLength(500)]),
    isSuspended: this.fb.control(false),
    isActive: this.fb.control(true),
  });

  formControls!: DynamicForm;
  private categoryOptions: ITextValueOption[] = [];
  private classSectionOptions: ITextValueOption[] = [];
  private academicYearOptions: ITextValueOption[] = [];
  private roleTypeOptions: ITextValueOption[] = [];
  private genderOptions: ITextValueOption[] = [];
  private userTypeOptions: ITextValueOption[] = [];

  constructor() {
    effect(() => {
      if (!this.isEditMode()) return;
      const studentData = this.studentStore.data();
      if (!studentData) return;
      this.patchForm(studentData);
    });

    this.bindDropdownToControl('categoryId', this.categoryDropdownList, (options) => {
      this.categoryOptions = options;
    });
    this.bindDropdownToControl('classSectionId', this.classSectionDropdownList, (options) => {
      this.classSectionOptions = options;
    });
    this.bindDropdownToControl('currentAcademicYearId', this.academicYearDropdownList, (options) => {
      this.academicYearOptions = options;
    }, () => {
      if (this.isEditMode() || !this.defaultAcademicYearId) return;
      const hasCurrentYear = this.academicYearOptions.some((x) => x.value === this.defaultAcademicYearId);
      if (hasCurrentYear) {
        this.formGroup.patchValue({ currentAcademicYearId: this.defaultAcademicYearId }, { emitEvent: false });
      }
    });
    this.bindDropdownToControl('roleId', this.roleTypeDropdownList, (options) => {
      this.formGroup.controls.roleId.setValue(options[0]?.value);
      this.roleTypeOptions = options;
    });
    this.bindDropdownToControl('gender', this.genderOptionsList, (options) => {
      this.genderOptions = options;
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
    this.studentStore.resetState();

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
      this.confirmService.confirmUserAction('inactivate', name, 'account', 'Student').pipe(untilDestroyed(this)).subscribe((confirmed) => {
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
                label: SYSTEM_CONST.LABELS.DOCUMENTS.STUDENT_PHOTO,
                altText: SYSTEM_CONST.LABELS.DOCUMENTS.STUDENT_PHOTO,
                fileType: 'image',
                allowedExtensions: ['.jpeg', '.jpg', '.png'],
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
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.PHONE_NUMBER, 'phoneNumber', undefined, InputType.contactNumber),
              type: DynamicFormControlType.ContactNumber,
              class: 'col-12 col-md-4',
            },
            {
              control: getDatePickerConfig(
                'dob',
                SYSTEM_CONST.LABELS.COMMON.DOB,
                undefined,
                undefined,
                () => CommonHelper.getDateByYear(100),
                () => CommonHelper.getDateByYear(0)
              ),
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDropdownConfig('categoryId', SYSTEM_CONST.LABELS.COMMON.CATEGORY, this.categoryOptions),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-sm-6 col-lg-4 col-xl-4',
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
            },
          ],
        },
        {
          title: SYSTEM_CONST.SECTIONS.CLASS,
          controls: [
            {
              control: {
                ...getDropdownConfig('classSectionId', SYSTEM_CONST.LABELS.ACADEMIC.CLASS, this.classSectionOptions, { isDisable: this.isEditMode() }),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getTextboxConfig(SYSTEM_CONST.LABELS.ACADEMIC.ROLL_NUMBER, 'rollNumber', undefined, InputType.number),
                allowFloatValues: false
              },
              type: DynamicFormControlType.Number,
              class: 'col-12 col-md-4',
            },
          ],
        },
        {
          title: SYSTEM_CONST.SECTIONS.ACADEMIC,
          controls: [
            {
              control: {
                ...getDropdownConfig('currentAcademicYearId', SYSTEM_CONST.LABELS.ACADEMIC.ACADEMIC_YEAR, this.academicYearOptions, { isDisable: this.isEditMode() }),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.ACADEMIC.ADMISSION_NUMBER, 'admissionNumber', undefined, InputType.text),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
              isHiddenField: () => !this.isEditMode()
            },
            {
              control: getDatePickerConfig(
                'admissionDate',
                SYSTEM_CONST.LABELS.ACADEMIC.ADMISSION_DATE,
                undefined,
                undefined,
                () => CommonHelper.getMinDateAfter(1, this.formGroup.controls.dob.value),
                () => CommonHelper.getDateByYear(-1)
              ),
              type: DynamicFormControlType.Datepicker,
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
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getDropdownConfig('roleId', SYSTEM_CONST.LABELS.USER.ROLE, this.roleTypeOptions),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE, undefined, undefined, this.onIsActiveChange),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
            {
              control: getSlideToggleConfig('isSuspended', SYSTEM_CONST.LABELS.ACADEMIC.IS_SUSPENDED),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-6 col-xl-6',
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
      key: BasicInformationForm.DROPDOWN_KEYS.category,
      endpoint: API.ADMIN.CONFIGURATION.STUDENT_CATEGORY.DROPDOWN,
    });
    this.dropdownStore.getDropdown({
      key: BasicInformationForm.DROPDOWN_KEYS.classSection,
      endpoint: API.ADMIN.CONFIGURATION.CLASSROOM.DROPDOWN,
    });
    this.dropdownStore.getDropdown({
      key: BasicInformationForm.DROPDOWN_KEYS.academicYear,
      endpoint: API.ADMIN.CONFIGURATION.ACADEMIC_YEAR.DROPDOWN,
      mapData: (items: AcademicYearDropdown[]) => {
        const currentAcademicYear = items.find((x) => x.isCurrent);
        this.defaultAcademicYearId = currentAcademicYear?.value as string ?? null;
        return items.map((item) => ({
          text: item.text,
          value: item.value,
        }));
      },
    });
    this.dropdownStore.getDropdown({
      key: BasicInformationForm.DROPDOWN_KEYS.roleType,
      endpoint: API.ADMIN.USER.ROLE.ROLEBYUSERTYPE,
      params: { userTypeId: UserTypeConst.Student },
    });
    this.dropdownStore.getDropdown({
      key: BasicInformationForm.DROPDOWN_KEYS.gender,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.Gender },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
    });
    this.dropdownStore.getDropdown({
      key: BasicInformationForm.DROPDOWN_KEYS.userType,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.UserTypeIds }
    });
  };

  onSave = (): void => {
    if (!this.formGroup.dirty || this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.commonHelperService.saveWithEmailVerification({
      store: this.studentStore,
      endpoint: API.ADMIN.USER.STUDENT.ADDUPDATE,
      payload,
      isSaveClickedSignal: this.isSaveClicked
    }).pipe(untilDestroyed(this)).subscribe();
  };

  saveWithResult = (): Observable<BaseSaveResponse | null> => {
    const payload = this.buildPayload();
    return this.commonHelperService.saveWithEmailVerification<Student, BaseSaveResponse>({
      store: this.studentStore,
      endpoint: API.ADMIN.USER.STUDENT.ADDUPDATE,
      payload,
      isSaveClickedSignal: this.isSaveClicked
    });
  };

  onCancel = (): void => {
    this.router.navigate(['admin', 'user', 'students']);
  };

  private resolveEditMode = (): void => {
    const studentIdParam = this.route.snapshot.paramMap.get('studentId');
    if (CommonHelper.isEmpty(studentIdParam)) return;

    this.editStudentId.set(studentIdParam);
    this.formGroup.controls.email.disable();
    this.studentStore.getById({
      endpoint: API.ADMIN.USER.STUDENT.Get,
      params: { studentId: studentIdParam },
    });
  };

  private patchForm = (student: Student): void => {
    this.formGroup.patchValue({
      ...student,
      userTypeId: student.userTypeId?.toLowerCase(),
      roleId: student.roleId?.toLowerCase(),
      dob: student.dob ? CommonHelper.toDateOnly(student.dob) : null,
      admissionDate: student.admissionDate ? CommonHelper.toDateOnly(student.admissionDate) : null,
    }, { emitEvent: false });
  };

  private buildPayload = (): Student => {
    return this.formGroup.getRawValue() as Student;
  };
}


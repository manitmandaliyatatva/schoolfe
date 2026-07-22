import { ChangeDetectionStrategy, Component, inject, OnDestroy, DestroyRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { FormUtils } from '../../../../../core/helpers/form-utils';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { API } from '../../../../../shared/constants/api-url';
import { ADMIN_ROUTE } from '../../../../../shared/constants/route.constant';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getDatePickerConfig, getDocumentUploadConfig, getDropdownConfig, getSlideToggleConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { Homework, HOMEWORK_CONST, homeworkDetailStore } from '../models/homework.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { HolidayHelperService } from '../../../../../core/services/holiday-helper.service';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';

@Component({
  selector: 'app-homework-form',
  imports: [ReactiveFormsModule, ButtonComponent, DynamicFormComponent],
  templateUrl: './homework-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeworkForm extends BaseFormComponent<Homework> implements OnDestroy {
  private readonly DROPDOWN_KEYS = {
    classroom: 'homeworkClassroom',
    subject: 'homeworkSubject',
  } as const;

  private readonly fb = inject(FormBuilder);
  protected override readonly store = inject(homeworkDetailStore);
  protected override readonly getByIdEndpoint = API.ADMIN.HOMEWORK.GET_BY_ID;
  protected override readonly entityIdParamKey = 'homeworkId';
  protected override restrictToCurrentYearOnly = true;

  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly authStore = inject(AuthStore);
  private readonly holidayHelperService = inject(HolidayHelperService);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly destroyRef = inject(DestroyRef);

  private classroomOptions: ITextValueOption[] = [];
  private subjectOptions: ITextValueOption[] = [];
  private lastLoadedClassId: string | null = null;
  readonly classroomDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.classroom);
  readonly subjectDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.subject);

  protected override formGroup = this.fb.group({
    homeworkId: [EMPTY_GUID],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required]],
    classSectionId: [null as string | null, [Validators.required]],
    subjectId: [null as string | null, [Validators.required]],
    assignedDate: [null as Date | null, [Validators.required]],
    dueDate: [null as Date | null, [Validators.required]],
    attachment: [null as string | null],
    attachmentFileName: [null as string | null],
    isActive: [true, [Validators.required]],
  });

  protected override formControls!: DynamicForm;

  constructor() {
    super();
    this.formGroup.controls.assignedDate.setValue(this.academicYearHelper.getDatepickerMinDate());
    this.bindDropdownToControl('classSectionId', this.classroomDropdownList, (options) => {
      this.classroomOptions = options;
      if (options.length > 0) {
        const control = this.formGroup.get('classSectionId');
        control?.setValue(control.value);
      }
    });
    this.bindDropdownToControl('subjectId', this.subjectDropdownList, (options) => {
      this.subjectOptions = options;
      if (options.length > 0) {
        const control = this.formGroup.get('subjectId');
        control?.setValue(control.value);
      }
    });
  }

  protected override loadData(): void {
    super.loadData();
    this.loadDropdownData();
  }

  private loadDropdownData(): void {
    const isTeacher = this.authStore.usertype() === 'Teacher';
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.classroom,
      endpoint: API.ADMIN.CONFIGURATION.CLASSROOM.DROPDOWN,
      params: { timetableSection: isTeacher },
    });

    const classSectionId = this.formGroup.controls.classSectionId.value;
    if (classSectionId) {
      this.loadSubjectsByClass(classSectionId);
    }
  }

  private loadSubjectsByClass(classId: any): void {
    if (this.lastLoadedClassId === classId) return;
    this.lastLoadedClassId = classId;

    if (CommonHelper.isEmpty(classId)) {
      this.dropdownStore.resetKey(this.DROPDOWN_KEYS.subject);
      return;
    }

    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.subject,
      endpoint: API.CLASS.SUBJECT_DROPDOWN,
      params: { classSectionId: classId },
      force: true
    });
  }

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(HOMEWORK_CONST.TITLE, 'title', undefined, InputType.text),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getDropdownConfig('classSectionId', SYSTEM_CONST.LABELS.COMMON.CLASSROOM, this.classroomOptions, null, null, (data: ITextValueOption) => {
                  this.loadSubjectsByClass(data.value);
                  if (data && data.value) {
                    this.holidayHelperService.loadHolidays({
                      classSectionId: String(data.value)
                    })
                      .pipe(takeUntilDestroyed(this.destroyRef))
                      .subscribe(() => {
                        this.formGroup.controls.assignedDate.updateValueAndValidity({ emitEvent: false });
                        this.formGroup.controls.dueDate.updateValueAndValidity({ emitEvent: false });
                        this.cdr.markForCheck();
                      });
                  }
                }),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getDropdownConfig('subjectId', SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT, this.subjectOptions),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDatePickerConfig(
                  'assignedDate',
                  HOMEWORK_CONST.ASSIGNED_DATE,
                  'outline',
                  undefined,
                  () => this.academicYearHelper.getDatepickerMinDate(),
                  () => {
                    const dueDate = this.formGroup.controls.dueDate.value;
                    return dueDate ? new Date(dueDate) : this.academicYearHelper.getDatepickerMaxDate();
                  }
                ),
                getWarning: (value: string | null) => this.holidayHelperService.getWarning(value)
              },
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDatePickerConfig(
                  'dueDate',
                  SYSTEM_CONST.LABELS.COMMON.DUE_DATE,
                  'outline',
                  undefined,
                  () => CommonHelper.getMinDateAfter(0, this.formGroup.controls.assignedDate.value),
                  () => this.academicYearHelper.getDatepickerMaxDate()
                ),
                getWarning: (value: string | null) => this.holidayHelperService.getWarning(value)
              },
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(HOMEWORK_CONST.DESCRIPTION, 'description', undefined, InputType.textarea),
              type: DynamicFormControlType.TextArea,
              class: 'col-12 col-md-6',
            },
            {
              control: getDocumentUploadConfig(
                'attachment',
                HOMEWORK_CONST.ATTACHMENT,
                ['.pdf'],
                false,
                this.editId() ? SYSTEM_CONST.LABELS.FILE_UPLOAD.CHANGE_FILE : SYSTEM_CONST.LABELS.FILE_UPLOAD.UPLOAD_FILE,
                API.ADMIN.HOMEWORK.GET_ATTACHMENT_BASE64,
                'homeworkId'
              ),
              type: DynamicFormControlType.DocumentUpload,
              class: 'col-6',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE, 'after', 'primary'),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-6',
            },
          ],
        },
      ],
    };
  }

  protected override patchForm(data: Homework): void {
    this.formGroup.patchValue({
      homeworkId: data.homeworkId,
      title: data.title ?? '',
      description: data.description ?? '',
      classSectionId: data.classSectionId ?? null,
      subjectId: data.subjectId ?? null,
      assignedDate: data.assignedDate ? new Date(data.assignedDate) : this.academicYearHelper.getDatepickerMinDate(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      attachment: data.attachment,
      attachmentFileName: data.attachmentFileName ?? null,
      isActive: data.isActive ?? true,
    });

    if (this.editId()) {
      const isPastAY = this.authStore.iscurrentacademicyear() === false;
      if (!isPastAY) {
        const isAssignedDatePast = CommonHelper.isPastDate(data.assignedDate);
        if (data.isEditable === false || isAssignedDatePast) {
          const fieldsToDisable = ['title', 'description', 'classSectionId', 'subjectId', 'assignedDate', 'attachment', 'isActive'];
          FormUtils.disableDynamicFormFields(this.formGroup, this.formControls, fieldsToDisable);
        }

        const assignedDateControl = this.formGroup.get('assignedDate');
        if (assignedDateControl) {
          assignedDateControl.clearValidators();
          assignedDateControl.updateValueAndValidity();
        }
      }
    }

    if (data.classSectionId) {
      this.loadSubjectsByClass(data.classSectionId);
      this.holidayHelperService.loadHolidays({
        classSectionId: String(data.classSectionId)
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.formGroup.controls.assignedDate.updateValueAndValidity({ emitEvent: false });
          this.formGroup.controls.dueDate.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        });
    }
  }

  protected override submitForm(): void {

    const value = this.formGroup.getRawValue();
    const payload = {
      ...value,
      homeworkId: this.editId() ?? EMPTY_GUID,
      assignedByUserId: this.authStore.userId() ?? null,
    };

    this.store.create({
      endpoint: API.ADMIN.HOMEWORK.ADD_UPDATE,
      body: payload as any,
    });
  }

  protected override cancelRoute(): string[] {
    return [this.authStore.roleRoutePath(), ADMIN_ROUTE.HOMEWORK.HOMEWORK, ADMIN_ROUTE.HOMEWORK.LIST];
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.holidayHelperService.clearHolidays();
    this.dropdownStore.resetState();
  }
}

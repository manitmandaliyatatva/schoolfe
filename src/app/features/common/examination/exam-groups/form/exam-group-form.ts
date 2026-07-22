import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnDestroy, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { FormatTimeForApi, ParseTimeToDate } from '../../../../../core/helpers/datetime.helper';
import { FormUtils } from '../../../../../core/helpers/form-utils';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';
import { HolidayHelperService } from '../../../../../core/services/holiday-helper.service';
import { ToastrHelperService } from '../../../../../core/services/toster-helper.service';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGrid, CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { CommonDatepickerComponent } from '../../../../../shared/components/common-datepicker/common-datepicker.component';
import { CommonDatepickerConfig } from '../../../../../shared/components/common-datepicker/model/common-datepicker.model';
import { CommonDropdownComponent } from '../../../../../shared/components/common-dropdown/common-dropdown.component';
import { CommonDropdownConfig } from '../../../../../shared/components/common-dropdown/model/common-dropdown.model';
import { CommonSlideToggleConfig } from '../../../../../shared/components/common-slide-toggle/models/common-slide-toggle.model';
import { CommonTimepickerComponent } from '../../../../../shared/components/common-timepicker/common-timepicker.component';
import { CommonTimepickerConfig } from '../../../../../shared/components/common-timepicker/model/common-timepicker.model';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { CommonTextboxConfig } from '../../../../../shared/components/textbox/model/textbox.model';
import { TextboxComponent } from '../../../../../shared/components/textbox/textbox.component';
import { API } from '../../../../../shared/constants/api-url';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { ADMIN_ROUTE } from '../../../../../shared/constants/route.constant';
import { InputType } from '../../../../../shared/Enums/common.enum';
import {
  getDatePickerConfig,
  getDropdownConfig,
  getSlideToggleConfig,
  getTextboxConfig,
  getTimepickerConfig
} from '../../../../../shared/functions/config-function';
import { buildGridToolbarButton } from '../../../../../shared/helpers/grid.helper';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { ConfirmationService } from '../../../../../shared/services/dialog.service';
import { EXAM_CONST, EXAM_GROUP_CONST, examGroupStore } from '../models/exam-group.model';
import { CommonDateFormat } from '../../../../../core/constants/date-format.constant';

@Component({
  selector: 'app-exam-group-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    CommonDropdownComponent,
    CommonDatepickerComponent,
    CommonTimepickerComponent,
    TextboxComponent,
    DynamicFormComponent,
    ButtonComponent,
    CommonDataGridComponent
  ],
  providers: [examGroupStore],
  templateUrl: './exam-group-form.html',
  styleUrls: ['./exam-group-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamGroupForm extends BaseFormComponent<any> implements OnInit, OnDestroy {
  protected readonly EXAM_GROUP_CONST = EXAM_GROUP_CONST;
  protected readonly systemConst = SYSTEM_CONST;
  private readonly fb = inject(FormBuilder);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly authStore = inject(AuthStore);
  private readonly holidayHelperService = inject(HolidayHelperService);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastrService = inject(ToastrHelperService);
  private readonly confirmationService = inject(ConfirmationService);

  @ViewChild('subjectTemplate', { static: true }) subjectTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate', { static: true }) dateTemplate!: TemplateRef<any>;
  @ViewChild('startTimeTemplate', { static: true }) startTimeTemplate!: TemplateRef<any>;
  @ViewChild('endTimeTemplate', { static: true }) endTimeTemplate!: TemplateRef<any>;
  @ViewChild('maxMarksTemplate', { static: true }) maxMarksTemplate!: TemplateRef<any>;
  @ViewChild('passingMarksTemplate', { static: true }) passingMarksTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate', { static: true }) actionTemplate!: TemplateRef<any>;
  @ViewChild('fullWidthRowTemplate', { static: true }) fullWidthRowTemplate!: TemplateRef<any>;

  readonly rows = signal<{ rowId: number }[]>([]);
  readonly isDataLoaded = signal(false);

  readonly holidayDatesList = signal<string[]>([]);
  readonly examDatesMap = signal<Record<number, string>>({});

  timelineRows = signal<any[]>([]);

  generateTimeline(): void {
    const datesMap = this.examDatesMap();
    const examRows = this.rows().map(r => {
      const dateStr = datesMap[r.rowId] || '';
      return {
        rowId: r.rowId,
        type: EXAM_GROUP_CONST.ROW_TYPE_EXAM,
        dateStr
      };
    });

    const holidayDatesList = this.holidayDatesList();
    const holidayRows = holidayDatesList.map((hDate, idx) => ({
      rowId: -100 - idx,
      type: EXAM_GROUP_CONST.ROW_TYPE_HOLIDAY,
      dateStr: hDate
    }));

    const combined: any[] = [];
    const sortedHolidays = [...holidayRows].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    let remainingHolidays = [...sortedHolidays];

    for (const exam of examRows) {
      if (exam.dateStr) {
        const before = remainingHolidays.filter(h => h.dateStr < exam.dateStr);
        combined.push(...before);
        remainingHolidays = remainingHolidays.filter(h => h.dateStr >= exam.dateStr);
      }
      combined.push(exam);
    }

    combined.push(...remainingHolidays);
    this.timelineRows.set(combined);
  }

  readonly examTypeDropdownList = this.dropdownStore.getList('examExamType');
  readonly subjectDropdownList = this.dropdownStore.getList('globalSubjects');

  readonly classDropdownList = this.dropdownStore.getList('globalClasses');
  allSubjects: ITextValueOption[] = [];
  examTypeOptions: ITextValueOption[] = [];
  classOptions: ITextValueOption[] = [];
  classSectionOptions: ITextValueOption[] = [];

  // Tracks active dynamic row IDs
  rowIndices: number[] = [];
  private nextRowId = 0;
  private static lastChangedRowId: number | null = null;

  // BaseFormComponent Overrides
  protected override formGroup: FormGroup<any> = this.fb.group({
    examGroupName: ['', [Validators.required]],
    classId: this.fb.control<string | null>(null, [Validators.required]),
    classSectionIds: this.fb.control<string[] | null>([], [Validators.required]),
    examTypeId: this.fb.control<string | null>(null, [Validators.required]),
    examGroupStartDate: this.fb.control<any>(null, [Validators.required]),
    examGroupEndDate: this.fb.control<any>(null, [Validators.required]),
    isActive: [true],
    isPublished: [false],
    holidayDates: [{ value: [], disabled: true }]
  }, {
    validators: [
      ExamGroupForm.validateSubjectTimeRanges(),
      ExamGroupForm.validateNoConflicts()
    ]
  });

  protected override formControls!: DynamicForm;
  protected override readonly store = inject(examGroupStore);

  protected override getByIdEndpoint = API.ADMIN.EXAMINATION.EXAM_GROUP.GET;
  protected override entityIdParamKey = 'examGroupId';

  protected override buildFormControls(): void {
    this.buildMasterConfigs();
    this.formControls = {
      formSection: [
        {
          controls: [
            {
              control: this.groupNameConfig,
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4 mb-3'
            },
            {
              control: this.classConfig,
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4 mb-3'
            },
            {
              control: this.classSectionConfig,
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4 mb-3'
            },
            {
              control: this.examTypeConfig,
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4 mb-3'
            },
            {
              control: this.startDateConfig,
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4 mb-3'
            },
            {
              control: this.endDateConfig,
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4 mb-3'
            },
            {
              control: this.isActiveConfig,
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-4 mb-3'
            },
            {
              control: this.isPublishedConfig,
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-4 mb-3'
            }
          ]
        }
      ]
    };
  }
  protected override patchForm(data: any): void {
    if (!data) return;

    if (data.classId) {
      this.dropdownStore.getDropdown({
        key: 'formClassSections',
        endpoint: API.CLASS.GET_CLASS_SECTION_LIST_BY_CLASS,
        params: { classId: data.classId }
      });
      this.holidayHelperService.loadHolidays({
        classId: String(data.classId)
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.refreshHolidaysAndValidate();
        });
    }

    const holidays = data.holidayDates
      ? (typeof data.holidayDates === 'string' ? data.holidayDates.split(',').filter((d: string) => !!d) : data.holidayDates)
      : [];

    this.formGroup.patchValue({
      examGroupName: data.examGroupName,
      classId: data.classId,
      classSectionIds: data.classSectionIds || [],
      examTypeId: data.examTypeId,
      examGroupStartDate: CommonHelper.toDateOnly(data.examGroupStartDate),
      examGroupEndDate: CommonHelper.toDateOnly(data.examGroupEndDate),
      isActive: data.isActive,
      isPublished: data.isPublished,
      holidayDates: holidays
    });

    this.holidayDatesList.set(holidays);
    this.examDatesMap.set({});

    if (data.exams && Array.isArray(data.exams)) {
      while (this.rowIndices.length > 0) {
        this.deleteRow(0);
      }
      data.exams.forEach((subj: any) => {
        this.addRow(true);
        const lastRowId = this.rowIndices[this.rowIndices.length - 1];
        const examDateStr = subj.examDate ? CommonHelper.toDateOnly(subj.examDate) : '';
        this.formGroup.patchValue({
          [`examId_${lastRowId}`]: subj.examId,
          [`subjectId_${lastRowId}`]: subj.subjectId,
          [`examDate_${lastRowId}`]: examDateStr,
          [`startTime_${lastRowId}`]: ParseTimeToDate(subj.startTime),
          [`endTime_${lastRowId}`]: ParseTimeToDate(subj.endTime),
          [`maxMarks_${lastRowId}`]: subj.maxMarks,
          [`passingMarks_${lastRowId}`]: subj.passingMarks
        });
        this.examDatesMap.update(map => ({ ...map, [lastRowId]: examDateStr }));
      });
      this.rearrangeTimeline();
    }

    this.applyFormDisablingRules(data);
    this.applyRowDisablingRules();
    this.syncExamDateDisabledState();
    this.isDataLoaded.set(true);
    this.cdr.detectChanges();
  }
  override onSave(): void {
    if (this.rowIndices.length === 0) {
      this.formGroup.markAllAsTouched();
      this.isSaveClicked.set(true);
      return;
    }
    super.onSave();
  }
  protected override submitForm(): void {
    const rawValue = this.formGroup.getRawValue();
    const examsList = this.rowIndices.map(rowId => ({
      examId: rawValue[`examId_${rowId}`] || EMPTY_GUID,
      subjectId: rawValue[`subjectId_${rowId}`],
      examDate: CommonHelper.toDateOnly(rawValue[`examDate_${rowId}`]),
      startTime: FormatTimeForApi(rawValue[`startTime_${rowId}`]),
      endTime: FormatTimeForApi(rawValue[`endTime_${rowId}`]),
      maxMarks: rawValue[`maxMarks_${rowId}`],
      passingMarks: rawValue[`passingMarks_${rowId}`]
    }));

    const holidayDatesList: string[] = Array.isArray(rawValue.holidayDates) ? rawValue.holidayDates : [];
    const holidayDatesStr = holidayDatesList.join(',');

    const payload = {
      examGroupId: this.editId() || EMPTY_GUID,
      examGroupName: rawValue.examGroupName,
      classId: rawValue.classId,
      classSectionIds: rawValue.classSectionIds || [],
      examTypeId: rawValue.examTypeId,
      examGroupStartDate: CommonHelper.toDateOnly(rawValue.examGroupStartDate),
      examGroupEndDate: CommonHelper.toDateOnly(rawValue.examGroupEndDate),
      isActive: rawValue.isActive,
      isPublished: rawValue.isPublished,
      holidayDates: holidayDatesStr,
      exams: examsList
    };

    this.store.create({
      endpoint: API.ADMIN.EXAMINATION.EXAM_GROUP.ADDUPDATE,
      body: payload
    });
  }
  protected override cancelRoute(): string[] {
    return [
      this.authStore.roleRoutePath(),
      ADMIN_ROUTE.EXAMINATION.EXAMINATION,
      ADMIN_ROUTE.EXAMINATION.EXAMS
    ];
  }

  onClassChange(classId: string | null): void {
    const classSectionIdsCtrl = this.formGroup.get('classSectionIds');
    if (classSectionIdsCtrl) {
      classSectionIdsCtrl.setValue([], { emitEvent: false });
      classSectionIdsCtrl.updateValueAndValidity({ emitEvent: false });
    }

    if (classId) {
      this.dropdownStore.getDropdown({
        key: 'formClassSections',
        endpoint: API.CLASS.GET_CLASS_SECTION_LIST_BY_CLASS,
        params: { classId: classId },
        force: true
      });
    } else {
      this.dropdownStore.resetKey('formClassSections');
    }
  }

  // Configs for Master Form
  groupNameConfig!: CommonTextboxConfig;
  classConfig!: CommonDropdownConfig;
  classSectionConfig!: CommonDropdownConfig;
  examTypeConfig!: CommonDropdownConfig;
  startDateConfig!: CommonDatepickerConfig;
  endDateConfig!: CommonDatepickerConfig;
  isActiveConfig!: CommonSlideToggleConfig;
  isPublishedConfig!: CommonSlideToggleConfig;
  holidayDatesConfig!: CommonDatepickerConfig;

  // FormArray Config Arrays
  subjectDropdownConfigs: CommonDropdownConfig[] = [];
  examDateConfigs: CommonDatepickerConfig[] = [];
  startTimeConfigs: CommonTimepickerConfig[] = [];
  endTimeConfigs: CommonTimepickerConfig[] = [];
  maxMarksConfigs: CommonTextboxConfig[] = [];
  passingMarksConfigs: CommonTextboxConfig[] = [];

  // Grid configuration and add button
  addBtn = computed<CommonButtonConfig>(() => buildGridToolbarButton({
    icon: 'add_2',
    tooltipText: EXAM_GROUP_CONST.ADD_ROW_TOOLTIP,
    callback: () => this.addRow(),
    isPrimary: true,
    isBtnVisible: () => {
      const endDateVal = this.formGroup.get('examGroupEndDate')?.value;
      if (endDateVal) {
        if (CommonHelper.toDateOnly(new Date()) >= CommonHelper.toDateOnly(endDateVal)) {
          return false;
        }
      }
      return this.allSubjects.length === 0 || this.rows().length < this.allSubjects.length;
    }
  }));

  rearrangeBtn = computed<CommonButtonConfig>(() => buildGridToolbarButton({
    icon: 'reorder',
    tooltipText: EXAM_GROUP_CONST.REARRANGE_TOOLTIP,
    callback: () => this.rearrangeTimeline(),
    isPrimary: false
  }));

  gridConfig = computed<CommonDataGrid<any>>(() => ({
    id: 'exam-group-subjects-grid',
    primaryKey: 'rowId',
    columns: this.buildColumns(),
    features: {
      showPagination: false,
      showSearch: false,
      showRefreshButton: false,
      enableDragAndDrop: false,
      isMergeColumn: (row: any) => row.type === EXAM_GROUP_CONST.ROW_TYPE_HOLIDAY,
      toolbar: {
        buttonConfig: [this.rearrangeBtn()]
      }
    },
    addButton: this.addBtn(),
    data: this.timelineRows(),
    customRenderTemplateCallback: (templateName: string) => {
      if (templateName === 'fullWidthRow') {
        return this.fullWidthRowTemplate;
      }
      return null as any;
    }
  }));

  private buildColumns(): CommonDataGridColumnConfig<any>[] {
    return [
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT,
        field: 'subjectId',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.subjectTemplate,
        cellStyle: this.getGridCellStyle,
        style: { width: '15%' }
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.DATE,
        field: 'examDate',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.dateTemplate,
        cellStyle: this.getGridCellStyle,
        style: { width: '15%' }
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.START_TIME,
        field: 'startTime',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.startTimeTemplate,
        cellStyle: this.getGridCellStyle,
        style: { width: '15%' }
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.END_TIME,
        field: 'endTime',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.endTimeTemplate,
        cellStyle: this.getGridCellStyle,
        style: { width: '15%' }
      },
      {
        title: EXAM_CONST.MAX_MARKS,
        field: 'maxMarks',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.maxMarksTemplate,
        cellStyle: this.getGridCellStyle,
        style: { width: '15%' }
      },
      {
        title: EXAM_CONST.PASSING_MARKS,
        field: 'passingMarks',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.passingMarksTemplate,
        cellStyle: this.getGridCellStyle,
        style: { width: '15%' }
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.ACTION,
        field: 'action',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.actionTemplate,
        alignment: 'center',
        cellStyle: this.getGridCellStyle,
        style: { width: '10%' }
      }
    ];
  }

  getGridCellStyle = (row: any) => {
    if (row.type === EXAM_GROUP_CONST.ROW_TYPE_HOLIDAY) {
      return { 'background-color': '#F4FBF9', 'color': '#2D7264' };
    }
    return null;
  };

  formatHolidayDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = CommonHelper.parseDateString(dateStr);
    return date ? CommonHelper.toFormattedDate(date, CommonDateFormat.DMMMYYYY_WithComma) : '';
  }

  getExamRowIndex(rowId: number): number {
    return this.rowIndices.indexOf(rowId);
  }

  onHolidayDatesChange(): void {
    const val = this.formGroup.get('holidayDates')?.value;
    const holidays = Array.isArray(val) ? val : [];
    this.holidayDatesList.set(holidays);
    this.generateTimeline();
    this.formGroup.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  refreshHolidaysAndValidate(): void {
    // First: update configs so Angular's CD picks up the new dateFilterFn reference
    this.holidayDatesConfig = { ...this.holidayDatesConfig };
    this.refreshRowConfigs(true);
    this.cdr.markForCheck();

    // Defer validation until AFTER the next CD cycle so that MatDatepickerInput
    // has received the updated [matDatepickerFilter] binding before validate() is called.
    // Without this defer, updateValueAndValidity() runs against the old filter function.
    setTimeout(() => {
      this.rowIndices.forEach(rowId => {
        this.formGroup.get(`examDate_${rowId}`)?.updateValueAndValidity();
      });
      this.formGroup.updateValueAndValidity();
      this.cdr.markForCheck();
    }, 0);
  }

  constructor() {
    super();

    this.bindDropdownToControl('classId', this.classDropdownList, (options) => {
      this.classOptions = options;
    });

    this.bindDropdownToControl('examTypeId', this.examTypeDropdownList, (options) => {
      this.examTypeOptions = options;
    });

    const formClassSectionsList = this.dropdownStore.getList('formClassSections');
    this.bindDropdownToControl('classSectionIds', formClassSectionsList, (options) => {
      this.classSectionOptions = options;
      if (this.classSectionConfig) {
        this.classSectionConfig.data = options;
      }
    });

    // React to changes in subjects list
    effect(() => {
      this.allSubjects = this.subjectDropdownList();
      this.recalculateSubjectOptions();
      this.cdr.markForCheck();
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadDropdownData();
  }

  override ngOnDestroy(): void {
    this.holidayHelperService.clearHolidays();
  }

  private loadDropdownData(): void {
    this.dropdownStore.getDropdown({
      key: 'examExamType',
      endpoint: API.ADMIN.EXAMINATION.EXAM_TYPE.DROPDOWN
    });

    this.dropdownStore.getDropdown({
      key: 'globalClasses',
      endpoint: API.CLASS.GET_CLASS_DROPDOWN
    });

    this.dropdownStore.getDropdown({
      key: 'globalSubjects',
      endpoint: API.CLASS.SUBJECT_DROPDOWN
    });
  }

  refreshRowConfigs(forceRecreate = false): void {
    if (forceRecreate) {
      this.examDateConfigs = this.examDateConfigs.map(cfg => ({ ...cfg }));
      this.startTimeConfigs = this.startTimeConfigs.map(cfg => ({ ...cfg }));
      this.endTimeConfigs = this.endTimeConfigs.map(cfg => ({ ...cfg }));
    } else {
      this.examDateConfigs = [...this.examDateConfigs];
      this.startTimeConfigs = [...this.startTimeConfigs];
      this.endTimeConfigs = [...this.endTimeConfigs];
    }
    this.cdr.markForCheck();
  }

  private getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private getMinExamDate(): Date {
    const today = this.getTodayDate();
    const startDateVal = this.formGroup.get('examGroupStartDate')?.value;
    if (startDateVal) {
      const startDate = new Date(startDateVal);
      startDate.setHours(0, 0, 0, 0);
      return startDate > today ? startDate : today;
    }
    return today;
  }

  private getTomorrowDate(): Date {
    const tomorrow = this.getTodayDate();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  private getMinHolidayDate(): Date {
    const tomorrow = this.getTomorrowDate();
    const startDateVal = this.formGroup.get('examGroupStartDate')?.value;
    if (startDateVal) {
      const startDate = CommonHelper.parseDateString(startDateVal);
      if (startDate) {
        return startDate > tomorrow ? startDate : tomorrow;
      }
    }
    return tomorrow;
  }

  private buildMasterConfigs(): void {
    this.groupNameConfig = getTextboxConfig(
      EXAM_GROUP_CONST.EXAM_GROUP_NAME,
      'examGroupName',
      undefined,
      InputType.text,
      'outline'
    );

    this.classConfig = {
      ...getDropdownConfig(
        'classId',
        SYSTEM_CONST.LABELS.ACADEMIC.CLASS,
        this.classOptions,
        undefined,
        undefined,
        (selected: any) => {
          const classId = selected?.value;
          this.onClassChange(classId);
          if (selected && selected.value) {
            this.holidayHelperService.loadHolidays({
              classId: String(selected.value)
            })
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => {
                this.refreshHolidaysAndValidate();
              });
          } else {
            this.holidayHelperService.clearHolidays();
            this.refreshHolidaysAndValidate();
          }
        }
      ),
      isFloatLabel: false
    };

    this.classSectionConfig = getDropdownConfig(
      'classSectionIds',
      SYSTEM_CONST.LABELS.COMMON.CLASSROOM,
      this.classSectionOptions,
      {
        allowMultiple: true,
        showToggleAllCheckbox: true
      }
    );

    this.examTypeConfig = getDropdownConfig(
      'examTypeId',
      EXAM_CONST.EXAM_TYPE,
      this.examTypeOptions
    );

    this.startDateConfig = getDatePickerConfig(
      'examGroupStartDate',
      SYSTEM_CONST.LABELS.COMMON.START_DATE,
      undefined,
      undefined,
      () => {
        if (this.isEditMode()) {
          const currentVal = this.formGroup.get('examGroupStartDate')?.value;
          if (currentVal) {
            return new Date(currentVal);
          }
        }
        const today = this.getTodayDate();
        const acadStart = this.academicYearHelper.getAcademicYearStartDate();
        return acadStart && acadStart > today ? acadStart : today;
      },
      () => this.formGroup.get('examGroupEndDate')?.value ? new Date(this.formGroup.get('examGroupEndDate')?.value) : this.academicYearHelper.getDatepickerMaxDate(),
      () => {
        const endDateCtrl = this.formGroup.get('examGroupEndDate');
        if (endDateCtrl) {
          endDateCtrl.updateValueAndValidity();
          endDateCtrl.markAsTouched();
        }
        this.syncExamDateDisabledState();
        this.formGroup.updateValueAndValidity();
        this.refreshRowConfigs(true);
      }
    );

    this.endDateConfig = getDatePickerConfig(
      'examGroupEndDate',
      SYSTEM_CONST.LABELS.COMMON.END_DATE,
      undefined,
      undefined,
      () => {
        const today = this.getTodayDate();
        const startDateCtrlVal = this.formGroup.get('examGroupStartDate')?.value;
        if (startDateCtrlVal) {
          const startDate = new Date(startDateCtrlVal);
          startDate.setHours(0, 0, 0, 0);
          return startDate > today ? startDate : today;
        }
        if (this.isEditMode()) {
          const currentVal = this.formGroup.get('examGroupEndDate')?.value;
          if (currentVal) {
            const current = new Date(currentVal);
            current.setHours(0, 0, 0, 0);
            return current > today ? current : today;
          }
        }
        const acadStart = this.academicYearHelper.getAcademicYearStartDate();
        return acadStart && acadStart > today ? acadStart : today;
      },
      () => this.academicYearHelper.getDatepickerMaxDate(),
      () => {
        const startDateCtrl = this.formGroup.get('examGroupStartDate');
        if (startDateCtrl) {
          startDateCtrl.updateValueAndValidity();
          startDateCtrl.markAsTouched();
        }
        this.syncExamDateDisabledState();
        this.formGroup.updateValueAndValidity();
        this.refreshRowConfigs(true);
      }
    );

    this.isActiveConfig = getSlideToggleConfig(
      'isActive',
      SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE,
      'after',
      'primary'
    );

    this.isPublishedConfig = getSlideToggleConfig(
      'isPublished',
      SYSTEM_CONST.LABELS.COMMON.IS_PUBLISHED,
      'after',
      'primary'
    );

    this.holidayDatesConfig = {
      ...getDatePickerConfig(
        'holidayDates',
        EXAM_GROUP_CONST.HOLIDAY_DATES,
        undefined,
        undefined,
        () => this.getMinHolidayDate(),
        () => {
          const endDate = this.formGroup.get('examGroupEndDate')?.value;
          return endDate
            ? (CommonHelper.parseDateString(endDate) || this.academicYearHelper.getDatepickerMaxDate())
            : this.academicYearHelper.getDatepickerMaxDate();
        },
        () => {
          this.onHolidayDatesChange();
        }
      ),
      multiple: true,
      allowClear: false,
      filterDate: (date: Date | null) => {
        if (!date) return true;
        const dateStr = CommonHelper.toDateOnly(date);

        // Always allow already-selected holiday dates so the user can deselect them
        const currentHolidays: string[] = Array.isArray(this.formGroup.get('holidayDates')?.value)
          ? this.formGroup.get('holidayDates')!.value
          : [];
        if (currentHolidays.includes(dateStr)) return true;

        // Disable actual holidays and weekend offs (same as exam date picker)
        const status = this.holidayHelperService.checkHolidayStatus(date);
        if (status.isHoliday || status.isWeekOff) return false;

        // Disable dates already selected as exam subject dates
        const examDates = this.rowIndices
          .map(id => this.formGroup.get(`examDate_${id}`)?.value)
          .filter(val => !!val)
          .map(val => CommonHelper.toDateOnly(val));
        return !examDates.includes(dateStr);
      }
    };
  }

  // Row Add / Delete Flow
  addRow(isInitialLoad = false): void {
    if (!isInitialLoad) {
      if (!this.formGroup.get('classId')?.value) {
        this.toastrService.showWarningMessage(EXAM_GROUP_CONST.SELECT_CLASS_WARNING);
        return;
      }
      if (this.allSubjects.length > 0 && this.rowIndices.length >= this.allSubjects.length) return;
    }

    const rowId = this.nextRowId++;
    this.rowIndices.push(rowId);
    this.rows.set([...this.rows(), { rowId }]);

    // Add controls to the form group
    this.formGroup.addControl(`examId_${rowId}`, this.fb.control<string | null>(null));
    this.formGroup.addControl(`subjectId_${rowId}`, this.fb.control<string | null>(null, [Validators.required]));
    const examDateCtrl = this.fb.control<any>(null, [Validators.required]);
    // Disable exam date until both examGroupStartDate and examGroupEndDate are set
    if (!this.formGroup.get('examGroupStartDate')?.value || !this.formGroup.get('examGroupEndDate')?.value) {
      examDateCtrl.disable({ emitEvent: false });
    }
    this.formGroup.addControl(`examDate_${rowId}`, examDateCtrl);
    this.formGroup.addControl(`startTime_${rowId}`, this.fb.control<any>(null, [Validators.required]));
    this.formGroup.addControl(`endTime_${rowId}`, this.fb.control<any>(null, [Validators.required]));
    this.formGroup.addControl(`maxMarks_${rowId}`, this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
      FormUtils.compareValueValidator(`passingMarks_${rowId}`, false, EXAM_CONST.MAX_MARKS, EXAM_CONST.PASSING_MARKS, false)
    ]));
    this.formGroup.addControl(`passingMarks_${rowId}`, this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
      FormUtils.compareValueValidator(`maxMarks_${rowId}`, true, EXAM_CONST.PASSING_MARKS, EXAM_CONST.MAX_MARKS, false)
    ]));

    // Track last changed row ID on value changes
    ['examDate', 'startTime', 'endTime'].forEach(field => {
      this.formGroup.get(`${field}_${rowId}`)?.valueChanges.subscribe((val) => {
        ExamGroupForm.lastChangedRowId = rowId;
        if (field === 'examDate') {
          let dateStr = '';
          if (val) {
            const jsDate = (val as any).toDate ? (val as any).toDate() : new Date(val);
            dateStr = CommonHelper.toDateOnly(jsDate);
          }
          this.examDatesMap.update(map => ({ ...map, [rowId]: dateStr }));
          this.holidayDatesConfig = { ...this.holidayDatesConfig };
          this.cdr.markForCheck();
        }
      });
    });

    // Push new configurations for this row
    this.subjectDropdownConfigs.push(
      getDropdownConfig(
        `subjectId_${rowId}`,
        '',
        [],
        {
          allowClear: false,
          allowSearching: true
        },
        [],
        () => this.recalculateSubjectOptions(),
        undefined,
        true // isFloatLabel
      )
    );

    this.examDateConfigs.push({
      ...getDatePickerConfig(
        `examDate_${rowId}`,
        '',
        undefined,
        undefined,
        () => this.getMinExamDate(),
        () => this.formGroup.get('examGroupEndDate')?.value ? new Date(this.formGroup.get('examGroupEndDate')?.value) : this.academicYearHelper.getDatepickerMaxDate(),
        () => {
          ExamGroupForm.lastChangedRowId = rowId;
          this.formGroup.updateValueAndValidity();
          this.refreshRowConfigs();
        },
        undefined,
        true // isFloatLabel
      ),
      getWarning: (value: string | null) => this.holidayHelperService.getWarning(value),
      openOnFocus: true,
      filterDate: (date: Date | null) => {
        if (!date) return true;
        const dateStr = CommonHelper.toDateOnly(date);
        const holidayDatesVal = this.formGroup.get('holidayDates')?.value;
        const holidayDatesList: string[] = Array.isArray(holidayDatesVal) ? holidayDatesVal : [];
        if (holidayDatesList.includes(dateStr)) return false;

        const status = this.holidayHelperService.checkHolidayStatus(date);
        return !status.isHoliday && !status.isWeekOff;
      },
      customValidationMessage: (errorType: string) => {
        if (errorType === 'holidayConflict') {
          return EXAM_GROUP_CONST.HOLIDAY_CONFLICT_ERROR;
        }
        return '';
      }
    });

    this.startTimeConfigs.push({
      ...getTimepickerConfig(`startTime_${rowId}`, ''),
      isFloatLabel: true,
    });

    this.endTimeConfigs.push({
      ...getTimepickerConfig(`endTime_${rowId}`, ''),
      isFloatLabel: true,
    });

    const maxMarksConfig = getTextboxConfig(
      '',
      `maxMarks_${rowId}`,
      undefined,
      InputType.number
    );
    maxMarksConfig.isFloatLabel = true;
    this.maxMarksConfigs.push(maxMarksConfig);

    const passingMarksConfig = getTextboxConfig(
      '',
      `passingMarks_${rowId}`,
      undefined,
      InputType.number
    );
    passingMarksConfig.isFloatLabel = true;
    this.passingMarksConfigs.push(passingMarksConfig);

    this.recalculateSubjectOptions();
    this.generateTimeline();
    this.cdr.markForCheck();
  }

  deleteRow(index: number, showConfirmation = false): void {
    const rowId = this.rowIndices[index];
    if (showConfirmation) {
      const subjectId = this.formGroup.get(`subjectId_${rowId}`)?.value;
      const subjectOpt = this.allSubjects.find(opt => opt.value === subjectId);
      const subjectName = subjectOpt ? subjectOpt.text : 'Subject';

      this.confirmationService.confirm({
        title: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        message: SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(subjectName),
        confirmText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL
      }).subscribe(confirmed => {
        if (confirmed) {
          this.executeDeleteRow(index, rowId);
        }
      });
    } else {
      this.executeDeleteRow(index, rowId);
    }
  }

  private executeDeleteRow(index: number, rowId: number): void {
    // Remove controls from form group
    this.formGroup.removeControl(`examId_${rowId}`);
    this.formGroup.removeControl(`subjectId_${rowId}`);
    this.formGroup.removeControl(`examDate_${rowId}`);
    this.formGroup.removeControl(`startTime_${rowId}`);
    this.formGroup.removeControl(`endTime_${rowId}`);
    this.formGroup.removeControl(`maxMarks_${rowId}`);
    this.formGroup.removeControl(`passingMarks_${rowId}`);

    // Remove configs
    this.rowIndices.splice(index, 1);
    this.rows.set(this.rows().filter(r => r.rowId !== rowId));
    this.subjectDropdownConfigs.splice(index, 1);
    this.examDateConfigs.splice(index, 1);
    this.startTimeConfigs.splice(index, 1);
    this.endTimeConfigs.splice(index, 1);
    this.maxMarksConfigs.splice(index, 1);
    this.passingMarksConfigs.splice(index, 1);

    this.examDatesMap.update(map => {
      const copy = { ...map };
      delete copy[rowId];
      return copy;
    });

    this.recalculateSubjectOptions();
    this.generateTimeline();
    this.holidayDatesConfig = { ...this.holidayDatesConfig };
    this.cdr.markForCheck();
  }
  rearrangeTimeline(): void {
    const datesMap = this.examDatesMap();

    // 1. Get the current list of exam rows with their dates and start times
    const examRowsWithDates = this.rowIndices.map((rowId, index) => {
      const startVal = this.formGroup.get(`startTime_${rowId}`)?.value;
      const startSeconds = FormUtils.getTimeInSeconds(startVal) ?? 86400;
      return {
        rowId,
        index,
        dateStr: datesMap[rowId] || '',
        startSeconds
      };
    });

    // 2. Sort them chronologically by date string, and by start time if dates are identical
    examRowsWithDates.sort((a, b) => {
      if (!a.dateStr && !b.dateStr) {
        return a.startSeconds - b.startSeconds;
      }
      if (!a.dateStr) return 1;
      if (!b.dateStr) return -1;

      const dateCompare = a.dateStr.localeCompare(b.dateStr);
      if (dateCompare !== 0) return dateCompare;

      return a.startSeconds - b.startSeconds;
    });

    const sortedIndices = examRowsWithDates.map(item => item.index);

    // 3. Update the class properties and signals using sorted mapping
    this.rowIndices = sortedIndices.map(idx => this.rowIndices[idx]);
    this.subjectDropdownConfigs = sortedIndices.map(idx => this.subjectDropdownConfigs[idx]);
    this.examDateConfigs = sortedIndices.map(idx => this.examDateConfigs[idx]);
    this.startTimeConfigs = sortedIndices.map(idx => this.startTimeConfigs[idx]);
    this.endTimeConfigs = sortedIndices.map(idx => this.endTimeConfigs[idx]);
    this.maxMarksConfigs = sortedIndices.map(idx => this.maxMarksConfigs[idx]);
    this.passingMarksConfigs = sortedIndices.map(idx => this.passingMarksConfigs[idx]);

    const currentRows = this.rows();
    this.rows.set(sortedIndices.map(idx => currentRows[idx]));

    // 4. Refresh and recalculate
    this.recalculateSubjectOptions();
    this.refreshRowConfigs();
    this.generateTimeline();
    this.cdr.markForCheck();
  }

  recalculateSubjectOptions(): void {
    const rawValue = this.formGroup.getRawValue();
    const selectedValues = this.rowIndices
      .map(rowId => rawValue[`subjectId_${rowId}`])
      .filter(val => !!val);

    this.rowIndices.forEach((rowId, index) => {
      const currentValue = this.formGroup.get(`subjectId_${rowId}`)?.value;
      const filtered = this.allSubjects.filter(opt =>
        opt.value === currentValue || !selectedValues.includes(opt.value)
      );

      this.subjectDropdownConfigs[index] = {
        ...this.subjectDropdownConfigs[index],
        data: filtered
      };
    });
    this.cdr.markForCheck();
  }

  isRowDisabled(rowIndex: number): boolean {
    const rowId = this.rowIndices[rowIndex];
    if (rowId === undefined) return false;

    const examDateVal = this.formGroup.get(`examDate_${rowId}`)?.value;
    const startTimeVal = this.formGroup.get(`startTime_${rowId}`)?.value;

    if (!examDateVal) return false;

    const todayStr = CommonHelper.toDateOnly(new Date());
    const examDateStr = CommonHelper.toDateOnly(examDateVal);

    if (todayStr > examDateStr) {
      return true;
    }

    if (todayStr === examDateStr) {
      if (!startTimeVal) return false;

      const now = new Date();
      let startHours = 0;
      let startMinutes = 0;

      if (startTimeVal instanceof Date) {
        startHours = startTimeVal.getHours();
        startMinutes = startTimeVal.getMinutes();
      } else if (typeof startTimeVal === 'string') {
        const parts = startTimeVal.split(':').map(Number);
        startHours = parts[0] || 0;
        startMinutes = parts[1] || 0;
      }

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutesTotal = startHours * 60 + startMinutes;

      return nowMinutes >= startMinutesTotal;
    }

    return false;
  }

  private applyFormDisablingRules(data: any): void {
    if (!data) return;

    const todayStr = CommonHelper.toDateOnly(new Date());
    const startDateStr = CommonHelper.toDateOnly(data.examGroupStartDate);
    const endDateStr = CommonHelper.toDateOnly(data.examGroupEndDate);

    if (todayStr >= startDateStr) {
      ['examGroupName', 'classId', 'classSectionIds', 'examTypeId', 'examGroupStartDate', 'isActive'].forEach(fieldName => {
        this.formGroup.get(fieldName)?.disable({ emitEvent: false });
      });
    }

    const hasAnyExamCompleted = this.rowIndices.some((rowId, index) => this.isRowDisabled(index));
    if (hasAnyExamCompleted) {
      this.formGroup.get('isPublished')?.disable({ emitEvent: false });
    }

    if (todayStr >= endDateStr) {
      this.formGroup.get('examGroupEndDate')?.disable({ emitEvent: false });
      this.saveBtn.set({
        ...this.saveBtn(),
        isBtnVisible: () => false
      });
    }
  }

  private applyRowDisablingRules(): void {
    this.rowIndices.forEach((rowId, index) => {
      if (this.isRowDisabled(index)) {
        ['subjectId', 'examDate', 'startTime', 'endTime', 'maxMarks', 'passingMarks'].forEach(field => {
          this.formGroup.get(`${field}_${rowId}`)?.disable({ emitEvent: false });
        });
      }
    });
  }

  private cleanupHolidayDates(): void {
    const val = this.formGroup.get('holidayDates')?.value;
    const holidays: string[] = Array.isArray(val) ? val : [];
    if (holidays.length === 0) return;

    const startDateVal = this.formGroup.get('examGroupStartDate')?.value;
    const endDateVal = this.formGroup.get('examGroupEndDate')?.value;

    const startBound = startDateVal ? CommonHelper.parseDateString(startDateVal) : null;
    const endBound = endDateVal ? CommonHelper.parseDateString(endDateVal) : null;

    if (startBound) startBound.setHours(0, 0, 0, 0);
    if (endBound) endBound.setHours(0, 0, 0, 0);

    const filteredHolidays = holidays.filter(hStr => {
      const hDate = CommonHelper.parseDateString(hStr);
      if (!hDate) return false;
      hDate.setHours(0, 0, 0, 0);

      if (startBound && hDate < startBound) return false;
      if (endBound && hDate > endBound) return false;
      return true;
    });

    if (filteredHolidays.length !== holidays.length) {
      this.formGroup.get('holidayDates')?.setValue(filteredHolidays, { emitEvent: false });
      this.holidayDatesList.set(filteredHolidays);
      this.generateTimeline();
    }
  }

  /** Disables all examDate controls when examGroupStartDate or examGroupEndDate is missing; enables them when both are set. */
  private syncExamDateDisabledState(): void {
    const hasStart = !!this.formGroup.get('examGroupStartDate')?.value;
    const hasEnd = !!this.formGroup.get('examGroupEndDate')?.value;
    const shouldEnable = hasStart && hasEnd;

    // Sync holidayDates control state
    const holidayCtrl = this.formGroup.get('holidayDates');
    if (holidayCtrl) {
      if (shouldEnable) {
        holidayCtrl.enable({ emitEvent: false });
        this.cleanupHolidayDates();
      } else {
        holidayCtrl.disable({ emitEvent: false });
      }
    }

    this.rowIndices.forEach((rowId, index) => {
      const ctrl = this.formGroup.get(`examDate_${rowId}`);
      if (!ctrl) return;
      if (shouldEnable && !this.isRowDisabled(index)) {
        ctrl.enable({ emitEvent: false });
      } else {
        ctrl.disable({ emitEvent: false });
      }
    });
    this.holidayDatesConfig = { ...this.holidayDatesConfig };
    this.cdr.markForCheck();
  }

  static validateSubjectTimeRanges(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormGroup)) return null;

      const lastRowId = ExamGroupForm.lastChangedRowId;
      const keys = Object.keys(control.controls);

      keys.forEach(key => {
        if (!key.startsWith('startTime_')) return;

        const rowId = Number(key.split('_')[1]);
        const startCtrl = control.get(`startTime_${rowId}`);
        const endCtrl = control.get(`endTime_${rowId}`);
        if (!startCtrl || !endCtrl) return;

        // Only run time-range check for rows that have been touched OR are the last-changed row.
        // This prevents errors appearing on untouched rows when a different row is filled.
        if (!startCtrl.touched && !endCtrl.touched && lastRowId !== rowId) return;

        FormUtils.validateTimeRange(`startTime_${rowId}`, `endTime_${rowId}`)(control);
        FormUtils.validateFutureTimeIfToday(`examDate_${rowId}`, `startTime_${rowId}`)(control);
      });
      return null;
    };
  }

  static validateNoConflicts(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormGroup)) return null;

      const keys = Object.keys(control.controls);
      const examRows: { rowId: string; dateStr: string; start: number; end: number }[] = [];

      const holidayCtrl = control.get('holidayDates');
      const holidayDatesList: string[] = Array.isArray(holidayCtrl?.value) ? holidayCtrl.value : [];

      keys.forEach(key => {
        if (!key.startsWith('examDate_')) return;
        const rowId = key.split('_')[1];
        const examDateCtrl = control.get(key);
        // Skip rows where the date is disabled (startDate/endDate not yet set)
        if (!examDateCtrl || examDateCtrl.disabled) return;
        const dateVal = examDateCtrl.value;
        const dateStr = dateVal ? CommonHelper.toDateOnly(dateVal) : '';

        if (dateStr && holidayDatesList.includes(dateStr)) {
          const currentErrors = { ...(examDateCtrl.errors ?? {}) };
          if (!currentErrors['holidayConflict']) {
            currentErrors['holidayConflict'] = true;
            examDateCtrl.setErrors(currentErrors);
          }
          examDateCtrl.markAsTouched();
        } else if (examDateCtrl.hasError('holidayConflict')) {
          const errors = { ...examDateCtrl.errors };
          delete errors['holidayConflict'];
          examDateCtrl.setErrors(Object.keys(errors).length ? errors : null);
        }

        const startVal = control.get(`startTime_${rowId}`)?.value;
        const endVal = control.get(`endTime_${rowId}`)?.value;

        if (dateVal && startVal && endVal) {
          const startSec = FormUtils.getTimeInSeconds(startVal);
          const endSec = FormUtils.getTimeInSeconds(endVal);
          if (startSec !== null && endSec !== null && startSec < endSec) {
            examRows.push({ rowId, dateStr, start: startSec, end: endSec });
          }
        }
      });

      // Determine which rows conflict
      const conflictingRowIds = new Set<string>();
      for (let i = 0; i < examRows.length; i++) {
        for (let j = i + 1; j < examRows.length; j++) {
          const a = examRows[i];
          const b = examRows[j];
          if (a.dateStr === b.dateStr && a.start < b.end && b.start < a.end) {
            // Blame the row the user most recently changed
            if (ExamGroupForm.lastChangedRowId === Number(a.rowId)) {
              conflictingRowIds.add(a.rowId);
            } else if (ExamGroupForm.lastChangedRowId === Number(b.rowId)) {
              conflictingRowIds.add(b.rowId);
            } else {
              // Default: blame the later-added row
              conflictingRowIds.add(Number(a.rowId) > Number(b.rowId) ? a.rowId : b.rowId);
            }
          }
        }
      }

      // Apply or clear examConflict on endTime controls
      keys.forEach(key => {
        if (!key.startsWith('endTime_')) return;
        const rowId = key.split('_')[1];
        const endCtrl = control.get(key);
        if (!endCtrl) return;

        if (conflictingRowIds.has(rowId)) {
          const currentErrors = { ...(endCtrl.errors ?? {}) };
          if (currentErrors['examConflict'] !== EXAM_GROUP_CONST.EXAM_CONFLICT_ERROR) {
            currentErrors['examConflict'] = EXAM_GROUP_CONST.EXAM_CONFLICT_ERROR;
            endCtrl.setErrors(currentErrors);
          }
          endCtrl.markAsTouched();
        } else if (endCtrl.hasError('examConflict')) {
          const errors = { ...endCtrl.errors };
          delete errors['examConflict'];
          endCtrl.setErrors(Object.keys(errors).length ? errors : null);
        }
      });

      return null;
    };
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject, computed, effect, untracked, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGrid, CommonDataGridActionButtonConfig, CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { getDateRangeConfig, getDropdownConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { EXAM_CONST } from '../../exam-groups/models/exam-group.model';
import { ExamGroupMarks, examGroupMarksStore, MARKS_ENTRY_CONST, publishExamMarksStore } from '../models/exam-group-marks.model';
import { EXAM_GROUP_CONST } from '../../exam-groups/models/exam-group.model';
import { StatusChipComponent } from '../../../../../shared/components/status-chip/status-chip.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ConfirmationService } from '../../../../../shared/services/dialog.service';

@Component({
  selector: 'app-exam-group-marks-list',
  standalone: true,
  imports: [CommonModule, CommonDataGridComponent, StatusChipComponent, MatIconModule, MatMenuModule],
  providers: [examGroupMarksStore, publishExamMarksStore],
  templateUrl: './exam-group-marks-list.html',
  styleUrls: ['./exam-group-marks-list.scss'],
})
export class ExamGroupMarksListComponent extends GridBase<ExamGroupMarks> implements OnInit, OnDestroy {
  @ViewChild('statusCell', { static: true }) statusCell!: TemplateRef<any>;
  @ViewChild('classSectionCell', { static: true }) classSectionCell!: TemplateRef<any>;

  protected readonly SYSTEM_CONST = SYSTEM_CONST;
  protected override store = inject(examGroupMarksStore);
  private readonly authStore = inject(AuthStore);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly marksConfirmService = inject(ConfirmationService);
  readonly marksConst = MARKS_ENTRY_CONST;
  private readonly publishExamMarksStore = inject(publishExamMarksStore);

  readonly classDropdownList = this.dropdownStore.getList('globalClasses');
  readonly examTypeDropdownList = this.dropdownStore.getList('examExamType');
  readonly filterClassSectionsDropdownList = this.dropdownStore.getList('filterClassSections');

  protected override apiEndpoint = API.ADMIN.EXAMINATION.MARKS.GET_COMPLETED_EXAM_GROUP_LIST;
  protected override deleteEndpoint = ''; // No delete action for this view
  protected override primaryKey: keyof ExamGroupMarks = 'examGroupId';
  protected override pageTitle = `${TITLES.ADMIN.EXAM_GROUP_MARKS}`;
  protected override showAddButton = false;

  protected override get routeBasePath(): string {
    return `${this.authStore.roleRoutePath()}/examination/marks`;
  }

  protected override deleteConfirmTitle = '';
  protected override deleteConfirmMessage = (row: ExamGroupMarks) => '';

  onViewClick = (row: ExamGroupMarks): void => {
    this.router.navigate([this.authStore.roleRoutePath(), 'examination', 'marks', 'view', row.examGroupId]);
  };

  onEditClickCustom = (row: ExamGroupMarks): void => {
    this.router.navigate([this.authStore.roleRoutePath(), 'examination', 'marks', 'edit', row.examGroupId]);
  };

  onPublishClick = (row: ExamGroupMarks): void => {
    this.marksConfirmService.confirm({
      title: MARKS_ENTRY_CONST.PUBLISH_TITLE,
      message: MARKS_ENTRY_CONST.PUBLISH_CONFIRM_MSG,
      confirmText: SYSTEM_CONST.ACTION_BUTTONS.CONFIRM,
      cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
    }).subscribe(confirmed => {
      if (confirmed) {
        this.publishExamMarksStore.createWithResult({
          endpoint: `${API.ADMIN.EXAMINATION.MARKS.PUBLISH_EXAM_MARKS}?examGroupId=${encodeURIComponent(row.examGroupId)}`,
          body: {},
        }).subscribe({
          next: () => this.reloadList(),
        });
      }
    });
  };

  protected override get baseActionButtons(): CommonDataGridActionButtonConfig<ExamGroupMarks>[] {
    return [
      {
        matIconName: 'edit',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
        callback: (row: ExamGroupMarks) => this.onEditClickCustom(row),
        visibleCallback: (row?: ExamGroupMarks) => {
          if (!row) return this.permission().canUpdate;
          return this.permission().canUpdate && row.isEditable;
        },
      },
    ];
  }

  protected override get extraActionButtons(): CommonDataGridActionButtonConfig<ExamGroupMarks>[] {
    return [
      {
        matIconName: 'visibility',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
        callback: (row: ExamGroupMarks) => this.onViewClick(row),
        visibleCallback: () => true,
      },
      {
        matIconName: 'publish',
        buttonText: MARKS_ENTRY_CONST.PUBLISH,
        callback: (row: ExamGroupMarks) => this.onPublishClick(row),
        visibleCallback: (row?: ExamGroupMarks) => {
          if (!row) return true;
          return row.isMarksCompleted && !row.isExamPublished;
        },
      },
    ];
  }

  constructor() {
    super();
    this.registerDropdownReactivity('classId', this.classDropdownList);
    this.registerDropdownReactivity('examTypeId', this.examTypeDropdownList);
    this.registerDropdownReactivity('classSectionId', this.filterClassSectionsDropdownList);
  }

  override ngOnInit(): void {
    if (!this.permission().canList) return;
    super.ngOnInit();
    this.loadDropdownData();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dropdownStore.resetState();
  }

  private loadDropdownData(): void {
    if (!this.permission().canList) return;
    this.dropdownStore.getDropdown({
      key: 'globalClasses',
      endpoint: API.CLASS.GET_CLASS_DROPDOWN
    });

    this.dropdownStore.getDropdown({
      key: 'examExamType',
      endpoint: API.ADMIN.EXAMINATION.EXAM_TYPE.DROPDOWN,
      params: { isForFilter: true }
    });
  }

  loadClassSections = (classId: any, formGroup?: FormGroup): void => {
    if (CommonHelper.isEmpty(classId)) {
      this.dropdownStore.resetKey('filterClassSections');
      formGroup?.get('classSectionId')?.setValue(null);
      return;
    }

    this.dropdownStore.getDropdown({
      key: 'filterClassSections',
      endpoint: API.CLASS.GET_CLASS_SECTION_LIST_BY_CLASS,
      params: { classId: classId },
      force: true
    });
  };

  private registerDropdownReactivity(
    formControlName: string,
    source: () => ITextValueOption[]
  ): void {
    effect(() => {
      const options = source();
      untracked(() => this.updateFormControlOptions(formControlName, options));
    });
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

  protected override buildGridConfig(): CommonDataGrid<ExamGroupMarks> {
    const config = super.buildGridConfig();
    config.features = {
      ...config.features,
      showSearch: true,
      filter: {
        form: {
          formSection: [
            {
              controls: [
                {
                  control: {
                    ...getDropdownConfig('classId', SYSTEM_CONST.LABELS.ACADEMIC.CLASS, this.classDropdownList()),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: {
                    ...getDropdownConfig('classSectionId', SYSTEM_CONST.LABELS.COMMON.CLASSROOM, this.filterClassSectionsDropdownList()),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: {
                    ...getDropdownConfig('examTypeId', EXAM_CONST.EXAM_TYPE, this.examTypeDropdownList()),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: {
                    ...getDateRangeConfig(
                      SYSTEM_CONST.LABELS.COMMON.START_DATE,
                      'startDateFrom',
                      'startDateTo'
                    ),
                    min: () => this.academicYearHelper.getAcademicYearStartDate(),
                    max: () => this.academicYearHelper.getDatepickerMaxDate()
                  },
                  type: DynamicFormControlType.DateRangePicker,
                  class: 'col-12',
                },
                {
                  control: {
                    ...getDateRangeConfig(
                      SYSTEM_CONST.LABELS.COMMON.END_DATE,
                      'endDateFrom',
                      'endDateTo'
                    ),
                    min: () => this.academicYearHelper.getAcademicYearStartDate(),
                    max: () => this.academicYearHelper.getDatepickerMaxDate()
                  },
                  type: DynamicFormControlType.DateRangePicker,
                  class: 'col-12',
                },
              ],
            },
          ],
        },
        formGroupCallback: (formGroup: FormGroup) => {
          const classId = formGroup.get('classId')?.value;
          if (classId) {
            this.loadClassSections(classId, formGroup);
          }

          formGroup.get('classId')?.valueChanges.subscribe((value) => {
            this.loadClassSections(value, formGroup);
          });
        },
      },
    };
    return config;
  }

  protected override buildColumns = (): CommonDataGridColumnConfig<ExamGroupMarks>[] => {
    return [
      {
        title: EXAM_GROUP_CONST.EXAM_GROUP_ID,
        field: 'examGroupId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        field: 'examGroupName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.CLASSROOM,
        field: 'classSectionNames',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.classSectionCell,
      },
      {
        title: EXAM_CONST.EXAM_TYPE,
        field: 'examTypeName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.START_DATE,
        field: 'examGroupStartDate',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.END_DATE,
        field: 'examGroupEndDate',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isMarksCompleted',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.statusCell,
      },
    ];
  };

  getIsCompletedCallback = (row: ExamGroupMarks) => {
    return () => row.isMarksCompleted;
  };

  getClassroomDisplay(value: string | null | undefined): string {
    return CommonHelper.getClassroomDisplay(value);
  }
}

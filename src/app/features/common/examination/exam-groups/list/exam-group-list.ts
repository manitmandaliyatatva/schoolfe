import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, OnInit, TemplateRef, untracked, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGrid, CommonDataGridActionButtonConfig, CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { getDateRangeConfig, getDropdownConfig } from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { ExamGroup, examGroupStore, EXAM_GROUP_CONST, EXAM_CONST } from '../models/exam-group.model';
import { ExamGroupDetailViewComponent } from '../shared/exam-group-detail-view/exam-group-detail-view.component';

@Component({
  selector: 'app-exam-group-list',
  standalone: true,
  imports: [CommonModule, CommonDataGridComponent],
  providers: [examGroupStore],
  templateUrl: './exam-group-list.html',
})
export class ExamGroupListComponent extends GridBase<ExamGroup> implements OnInit, OnDestroy {
  protected override store = inject(examGroupStore);
  private readonly authStore = inject(AuthStore);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly genericDialogService = inject(GenericDialogService);

  readonly classDropdownList = this.dropdownStore.getList('globalClasses');
  readonly examTypeDropdownList = this.dropdownStore.getList('examExamType');
  readonly filterClassSectionsDropdownList = this.dropdownStore.getList('filterClassSections');

  @ViewChild('classSectionCell', { static: true }) classSectionCell!: TemplateRef<any>;

  protected override apiEndpoint = API.ADMIN.EXAMINATION.EXAM_GROUP.LIST;
  protected override deleteEndpoint = API.ADMIN.EXAMINATION.EXAM_GROUP.DELETE;
  protected override primaryKey: keyof ExamGroup = 'examGroupId';
  protected override pageTitle = `${TITLES.ADMIN.EXAM_GROUP}`;

  protected override get routeBasePath(): string {
    return `${this.authStore.roleRoutePath()}/examination/exams`;
  }

  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: ExamGroup) =>
    SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.examGroupName);

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

  protected override buildGridConfig(): CommonDataGrid<ExamGroup> {
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

  protected override buildColumns = (): CommonDataGridColumnConfig<ExamGroup>[] => {
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
        field: 'isActive',
        isSortable: true,
      },
    ];
  };

  private isStartDatePassedOrToday(startDateStr: string | Date | undefined): boolean {
    if (!startDateStr) return false;
    return CommonHelper.toDateOnly(new Date()) >= CommonHelper.toDateOnly(startDateStr);
  }

  private isEndDatePassed(endDateStr: string | Date | undefined): boolean {
    return CommonHelper.isPastDate(endDateStr);
  }

  getClassroomDisplay(value: string | null | undefined): string {
    return CommonHelper.getClassroomDisplay(value);
  }

  onViewClick = (row: ExamGroup): void => {
    this.genericDialogService.open({
      title: TITLES.ADMIN.VIEW_EXAM_GROUP,
      component: ExamGroupDetailViewComponent,
      data: row.examGroupId,
      maxWidth: '750px',
    });
  }

  protected override get baseActionButtons(): CommonDataGridActionButtonConfig<ExamGroup>[] {
    return [
      {
        matIconName: 'edit',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
        callback: this.onEditClick,
        visibleCallback: (row?: ExamGroup) => {
          if (!row) return this.permission().canUpdate;
          return this.permission().canUpdate && row.isEditable !== false;
        },
      },
      {
        matIconName: 'delete',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        callback: this.onDeleteClick,
        visibleCallback: (row?: ExamGroup) => {
          if (!row) return this.permission().canDelete;
          // Hide delete when edit button is hidden (row not editable)
          return this.permission().canDelete && row.isEditable !== false && !this.isStartDatePassedOrToday(row.examGroupStartDate);
        },
      },
    ];
  }

  protected override get extraActionButtons(): CommonDataGridActionButtonConfig<ExamGroup>[] {
    return [
      {
        matIconName: 'visibility',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
        callback: (row: ExamGroup) => this.onViewClick(row),
        visibleCallback: () => true,
      },
    ];
  }
}

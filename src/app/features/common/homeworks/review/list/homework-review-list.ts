import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  untracked,
  ViewChild
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { AuthStore } from '../../../../../core/store/auth.store';
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
import {
  getDateRangeConfig,
  getDropdownConfig,
} from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { HOMEWORK_CONST } from '../../homeworks/models/homework.model';
import {
  HOMEWORK_REVIEW_CONST,
  HomeworkReviewListItem,
  homeworkReviewListStore,
} from '../models/review.model';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';

@Component({
  selector: 'app-homework-review-list',
  imports: [CommonModule, CommonDataGridComponent],
  providers: [homeworkReviewListStore],
  templateUrl: './homework-review-list.html',
})
export class HomeworkReviewList
  extends GridBase<HomeworkReviewListItem>
  implements OnInit, OnDestroy {
  private readonly DROPDOWN_KEYS = {
    classroom: 'homeworkReviewClassroom',
    subject: 'homeworkReviewSubject',
  } as const;

  protected override store = inject(homeworkReviewListStore);
  private readonly authStore = inject(AuthStore);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly academicYearHelper = inject(AcademicYearHelperService);

  private lastLoadedClassId: string | null = null;

  readonly classroomDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.classroom);
  readonly subjectDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.subject);

  @ViewChild('submittedToReviewCell', { static: true }) submittedToReviewCell!: TemplateRef<any>;
  @ViewChild('reviewedCell', { static: true }) reviewedCell!: TemplateRef<any>;
  @ViewChild('classSectionCellTemplate', { static: true })
  classSectionCellTemplate!: TemplateRef<any>;

  constructor() {
    super();
    this.registerDropdownReactivity('classSectionId', this.classroomDropdownList);
    this.registerDropdownReactivity('subjectId', this.subjectDropdownList);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.screenTitle.set(HOMEWORK_REVIEW_CONST.LIST_TITLE);
    this.loadDropdownData();
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

  private loadDropdownData(): void {
    const isTeacher = this.authStore.usertype() === 'Teacher';
    this.dropdownStore.getDropdown<any>({
      key: this.DROPDOWN_KEYS.classroom,
      endpoint: API.ADMIN.CONFIGURATION.CLASSROOM.DROPDOWN,
      params: { timetableSection: isTeacher },
    });
  }

  private loadSubjectsByClass(classId: any, formGroup: FormGroup): void {
    if (this.lastLoadedClassId === classId) return;
    this.lastLoadedClassId = classId;

    if (CommonHelper.isEmpty(classId)) {
      this.dropdownStore.resetKey(this.DROPDOWN_KEYS.subject);
      formGroup.get('subjectId')?.setValue(null);
      return;
    }

    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.subject,
      endpoint: API.CLASS.SUBJECT_DROPDOWN,
      params: { classSectionId: classId },
      force: true,
    });
  }

  protected override buildGridConfig(): CommonDataGrid<HomeworkReviewListItem> {
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
                    ...getDropdownConfig(
                      'classSectionId',
                      SYSTEM_CONST.LABELS.COMMON.CLASSROOM,
                      this.classroomDropdownList()
                    ),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: {
                    ...getDropdownConfig(
                      'subjectId',
                      SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT,
                      this.subjectDropdownList()
                    ),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: getDateRangeConfig(
                    HOMEWORK_CONST.ASSIGNED_DATE,
                    'assignedDateFrom',
                    'assignedDateTo',
                    null,
                    null,
                    null,
                    null,
                    () => this.academicYearHelper.getAcademicYearStartDate(),
                    () => this.academicYearHelper.getDatepickerMaxDate()
                  ),
                  type: DynamicFormControlType.DateRangePicker,
                  class: 'col-12',
                },
                {
                  control: getDateRangeConfig(
                    SYSTEM_CONST.LABELS.COMMON.DUE_DATE,
                    'dueDateFrom',
                    'dueDateTo',
                    null,
                    null,
                    null,
                    null,
                    () => this.academicYearHelper.getAcademicYearStartDate(),
                    () => this.academicYearHelper.getDatepickerMaxDate()),
                  type: DynamicFormControlType.DateRangePicker,
                  class: 'col-12',
                },
              ],
            },
          ],
        },
        formGroupCallback: (formGroup: FormGroup) => {
          const classId = formGroup.get('classSectionId')?.value;
          if (classId) {
            this.loadSubjectsByClass(classId, formGroup);
          }

          formGroup.get('classSectionId')?.valueChanges.subscribe((value) => {
            this.loadSubjectsByClass(value, formGroup);
          });
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


  protected override apiEndpoint = API.ADMIN.HOMEWORK.REVIEW_LIST;
  protected override deleteEndpoint = API.ADMIN.HOMEWORK.DELETE;
  protected override primaryKey: keyof HomeworkReviewListItem = 'homeworkId';
  protected override pageTitle = TITLES.ADMIN.HOMEWORK_REVIEW;
  protected override showAddButton = false;
  protected override get routeBasePath(): string {
    return `${this.authStore.roleRoutePath()}/homework/reviews`;
  }

  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: HomeworkReviewListItem) =>
    SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.title);

  onViewClick = (row: HomeworkReviewListItem): void => {
    this.router.navigate([...this.routeBasePath.split('/'), 'view', row[this.primaryKey]]);
  };

  protected override get baseActionButtons(): CommonDataGridActionButtonConfig<HomeworkReviewListItem>[] {
    return [
      {
        matIconName: 'visibility',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
        callback: this.onViewClick,
        visibleCallback: () => this.permission().canView,
      },
      {
        matIconName: 'edit',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
        callback: this.onEditClick,
        visibleCallback: () => this.permission().canUpdate && this.authStore.iscurrentacademicyear() !== false,
      },
    ];
  }

  protected override buildColumns = (): CommonDataGridColumnConfig<HomeworkReviewListItem>[] => {
    return [
      {
        title: HOMEWORK_REVIEW_CONST.HOMEWORK_TITLE,
        field: 'title',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.CLASSROOM,
        field: 'className',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.classSectionCellTemplate,
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT,
        field: 'subjectName',
        isSortable: true,
      },
      {
        title: HOMEWORK_CONST.ASSIGNED_DATE,
        field: 'assignedDate',
        fieldDataType: CommonDataGridFieldDataType.Date,
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.DUE_DATE,
        field: 'dueDate',
        fieldDataType: CommonDataGridFieldDataType.Date,
        isSortable: true,
      },
      {
        title: HOMEWORK_REVIEW_CONST.SUBMITTED_TO_REVIEW,
        field: 'submittedCount',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.submittedToReviewCell,
        isSortable: true,
      },
      {
        title: HOMEWORK_REVIEW_CONST.REVIEWED,
        field: 'reviewedCount',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.reviewedCell,
        isSortable: true,
      },
    ];
  };
  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dropdownStore.resetState();
  }
}

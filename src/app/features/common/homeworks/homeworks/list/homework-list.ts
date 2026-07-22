import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  untracked,
  ViewChild,
} from '@angular/core';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { FormGroup } from '@angular/forms';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { ToastrHelperService } from '../../../../../core/services/toster-helper.service';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import {
  CommonDataGridFieldDataType,
  CommonDataGridFieldType,
} from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import {
  CommonDataGrid,
  CommonDataGridColumnConfig,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { getDateRangeConfig, getDropdownConfig } from '../../../../../shared/functions/config-function';
import FileHelper from '../../../../../shared/helpers/file.helper';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { base64DocumentStore } from '../../../../../shared/models/document.model';
import { HomeworkStatusChip } from '../../shared/homework-status-chip/homework-status-chip';
import {
  Homework,
  HOMEWORK_CONST,
  homeworkStore,
} from '../models/homework.model';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';

@Component({
  selector: 'app-homework-list',
  standalone: true,
  imports: [CommonModule, CommonDataGridComponent, HomeworkStatusChip],
  templateUrl: './homework-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [homeworkStore, base64DocumentStore],
})
export class HomeworkList extends GridBase<Homework> implements OnInit, OnDestroy {
  private readonly DROPDOWN_KEYS = {
    classroom: 'homeworkFilterClassroom',
    subject: 'homeworkFilterSubject',
  } as const;

  protected override store = inject(homeworkStore);
  protected readonly systemConst = SYSTEM_CONST;
  private readonly homeworkBase64Store = inject(base64DocumentStore);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly authStore = inject(AuthStore);
  private readonly academicYearHelper = inject(AcademicYearHelperService);

  private lastLoadedClassId: string | null = null;

  readonly classroomDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.classroom);
  readonly subjectDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.subject);

  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: TemplateRef<any>;
  private readonly toaster = inject(ToastrHelperService);
  private readonly pendingViewRow = signal<Homework | null>(null);
  protected override apiEndpoint = API.ADMIN.HOMEWORK.LIST;
  protected override deleteEndpoint = API.ADMIN.HOMEWORK.DELETE;
  protected override primaryKey: keyof Homework = 'homeworkId';
  protected override pageTitle = TITLES.HOMEWORK;
  protected override routeBasePath = `${this.authStore.roleRoutePath()}/homework/homeworks`;
  protected override restrictToCurrentYearOnly = true;
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: Homework) =>
    SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.title);

  override permission = computed(() => {
    const perm = this.commonHelperService.getPermissionByPage();
    return {
      ...perm,
      showGridAction: perm.showGridAction || this.authStore.isStudent(),
    };
  });

  constructor() {
    super();
    effect(() => {
      const row = this.pendingViewRow();
      if (!row) return;
      if (this.homeworkBase64Store.isLoading()) return;

      const data = this.homeworkBase64Store.data() as unknown as Record<string, unknown> | null;
      this.pendingViewRow.set(null);
      if (!data) {
        return;
      }

      const fileName = String(
        data['fileName'] ??
        data['FileName'] ??
        row.attachmentFileName ??
        HOMEWORK_CONST.DEFAULT_FILE_NAME
      );
      const contentType = String(
        data['contentType'] ?? data['ContentType'] ?? HOMEWORK_CONST.MIME_TYPE_PDF
      );
      const rawBase64 =
        data['base64'] ?? data['Base64'] ?? data['base64Data'] ?? data['Base64Data'];
      const parsedBase64 = typeof rawBase64 === 'string' ? rawBase64 : '';
      const payload = FileHelper.parseBase64Payload(parsedBase64);
      const normalizedBase64 = payload?.base64 || parsedBase64;

      if (!normalizedBase64) {
        this.toaster.showWarningMessage(HOMEWORK_CONST.MESSAGES.EMPTY_ERROR);
        return;
      }

      const objectUrl = FileHelper.base64ToURL(
        normalizedBase64,
        contentType || payload?.mimeType || HOMEWORK_CONST.MIME_TYPE_PDF
      );
      if (!objectUrl) {
        this.toaster.showErrorMessage(HOMEWORK_CONST.MESSAGES.PREVIEW_ERROR);
        return;
      }

      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      this.toaster.showSuccessMessage(HOMEWORK_CONST.MESSAGES.OPENED_SUCCESS(fileName));
    });

    this.registerDropdownReactivity('classSectionId', this.classroomDropdownList);
    this.registerDropdownReactivity('subjectId', this.subjectDropdownList);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadDropdownData();
  }

  updateFormControlOptions = (formControlName: string, options: ITextValueOption[]): void => {
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

  loadDropdownData = (): void => {
    if (this.authStore.isStudent()) {
      this.loadSubjectsByClass(null);
      return;
    }

    const isTeacher = this.authStore.usertype() === 'Teacher';
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.classroom,
      endpoint: API.ADMIN.CONFIGURATION.CLASSROOM.DROPDOWN,
      params: { timetableSection: isTeacher },
    });
  }

  loadSubjectsByClass = (classId: any, formGroup?: FormGroup): void => {
    if (this.authStore.isStudent()) {
      if (this.lastLoadedClassId === 'STUDENT') return;
      this.lastLoadedClassId = 'STUDENT';
      this.dropdownStore.getDropdown({
        key: this.DROPDOWN_KEYS.subject,
        endpoint: API.CLASS.SUBJECT_DROPDOWN,
        force: true,
      });
      return;
    }

    if (this.lastLoadedClassId === classId) return;
    this.lastLoadedClassId = classId;

    if (CommonHelper.isEmpty(classId)) {
      this.dropdownStore.resetKey(this.DROPDOWN_KEYS.subject);
      formGroup?.get('subjectId')?.setValue(null);
      return;
    }

    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.subject,
      endpoint: API.CLASS.SUBJECT_DROPDOWN,
      params: { classSectionId: classId },
      force: true
    });
  }

  protected override buildGridConfig = (): CommonDataGrid<Homework> => {
    const config = super.buildGridConfig();
    const isStudent = this.authStore.isStudent();
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
                    ...getDropdownConfig('classSectionId', SYSTEM_CONST.LABELS.COMMON.CLASSROOM, this.classroomDropdownList()),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                  isHiddenField: () => isStudent,
                },
                {
                  control: {
                    ...getDropdownConfig('subjectId', SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT, this.subjectDropdownList()),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: getDateRangeConfig(
                    'Assigned Date', 
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
                    'Due Date', 
                    'dueDateFrom', 
                    'dueDateTo',
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
              ],
            },
          ],
        },
        formGroupCallback: (formGroup: FormGroup) => {
          if (isStudent) {
            this.loadSubjectsByClass(null, formGroup);
            return;
          }

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

  registerDropdownReactivity = (
    formControlName: string,
    source: () => ITextValueOption[]
  ): void => {
    effect(() => {
      const options = source();
      untracked(() => this.updateFormControlOptions(formControlName, options));
    });
  }

  onViewAttachmentClick = (row: Homework): void => {
    if (CommonHelper.isEmpty(row.homeworkId) || !row.attachmentFilePath) return;
    this.pendingViewRow.set(row);
    this.homeworkBase64Store.resetState();
    this.homeworkBase64Store.getById({
      endpoint: API.ADMIN.HOMEWORK.GET_ATTACHMENT_BASE64,
      params: { homeworkId: row.homeworkId },
    });
  };

  protected override buildColumns = (): CommonDataGridColumnConfig<Homework>[] => {
    return [
      {
        title: HOMEWORK_CONST.TITLE,
        field: 'title',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.String,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.CLASSROOM,
        field: 'classSectionName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT,
        field: 'subjectName',
        isSortable: true,
      },
      {
        title: HOMEWORK_CONST.ASSIGNED_BY,
        field: 'assignedByUserName',
        isSortable: true,
      },
      {
        title: HOMEWORK_CONST.ASSIGNED_DATE,
        field: 'assignedDate',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.DUE_DATE,
        field: 'dueDate',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date,
      },
      {
        title: HOMEWORK_CONST.ATTACHMENT_NAME,
        field: 'attachmentFileName',
        isSortable: true,
        fieldType: CommonDataGridFieldType.Link,
        hasPermission: this.permission().canDownload,
        callback: this.onViewAttachmentClick,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field:
          this.authStore.isStudent() ? ('studentHomeworkStatus' as any) : 'isActive',
        isSortable: true,
        fieldDataType:
          this.authStore.isStudent()
            ? CommonDataGridFieldDataType.CustomRenderTemplate
            : CommonDataGridFieldDataType.Boolean,
        customRenderCell:
          this.authStore.isStudent() ? this.statusCellTemplate : undefined,
      },
    ];
  };

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.homeworkBase64Store.resetState();
  }
}

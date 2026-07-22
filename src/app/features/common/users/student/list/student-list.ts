import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  untracked,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonDateFormat } from '../../../../../core/constants/date-format.constant';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { ButtonType } from '../../../../../core/models/common.model';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType, CommonDataGridFieldType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import {
  CommonDataGrid,
  CommonDataGridActionButtonConfig,
  CommonDataGridColumnConfig,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { SafeImageComponent } from '../../../../../shared/components/safe-image/safe-image.component';
import { API } from '../../../../../shared/constants/api-url';
import { LookupMnemonics } from '../../../../../shared/constants/lookup-type-ids.constant';
import { TITLES } from '../../../../../shared/constants/title.constant';
import {
  getDateRangeConfig,
  getDropdownConfig,
  getRadioButtonConfig
} from '../../../../../shared/functions/config-function';
import { ExportConst, ExportService } from '../../../../../core/services/export.service';
import { buildGridListRequest } from '../../../../../shared/helpers/grid.helper';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { Student, STUDENT_CONST, studentStore } from '../../../../admin/user/student/models/student.model';
import CommonHelper from '../../../../../core/helpers/common-helper';
  
@Component({
  selector: 'common-student-list',
  standalone: true,
  imports: [CommonModule, CommonDataGridComponent, MatButtonModule, SafeImageComponent, MatIconModule, ReactiveFormsModule],
  providers: [studentStore],
  templateUrl: './student-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentList extends GridBase<Student> implements OnInit, OnDestroy {
  private readonly DROPDOWN_KEYS = {
    classroom: 'studentListClassroom',
    category: 'studentListCategory',
    gender: 'studentListGender',
  } as const;

  protected readonly authStore = inject(AuthStore);
  protected override store = inject(studentStore);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly exportService = inject(ExportService);

  exportBtnConfig = this.exportService.getExportButtonConfig(() => this.exportStudents());
  importBtnConfig = this.exportService.getImportButtonConfig(() => ({
    title: STUDENT_CONST.IMPORT_STUDENTS,
    sampleFileEndpoint: API.SAMPLE_FILE.STUDENT,
    endpoint: API.IMPORT_FILE.STUDENT,
  }), () => {
    this.reloadList();
  });

  private exportStudents(): void {
    const state = this.currentGridState();
    const payload = {
      ...buildGridListRequest<Student>({
        pageIndex: 0,
        pageSize: -1,
        defaultSortingColumn: state.sortColumn as any,
        sortOrder: state.sortOrder,
        generalSearch: state.generalSearch,
        filterData: state.extraFilters,
      }),
      isExport: true,
    };

    this.exportService.export({
      endpoint: this.apiEndpoint,
      payload: payload,
      defaultFileName: ExportConst.FileName.StudentList,
    });
  }

  protected override apiEndpoint = API.ADMIN.USER.STUDENT.List;
  protected override deleteEndpoint = API.ADMIN.USER.STUDENT.DELETE;
  protected override primaryKey: keyof Student = 'studentId';
  protected override skipViewPermissionForEdit = true;

  readonly classroomDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.classroom);
  readonly categoryDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.category);
  readonly genderDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.gender);

  constructor() {
    super();
    this.registerDropdownReactivity('classSectionId', this.classroomDropdownList);
    this.registerDropdownReactivity('categoryId', this.categoryDropdownList);
    this.registerDropdownReactivity('gender', this.genderDropdownList);
  }

  override ngOnInit(): void {
    super.ngOnInit();
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
        if (controlConfig.type === DynamicFormControlType.DropDown) {
          (controlConfig.control as any).data = options;
        } else if (controlConfig.type === DynamicFormControlType.Radiobutton) {
          (controlConfig.control as any).options = options;
        }
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
    this.dropdownStore.getDropdown<any>({
      key: this.DROPDOWN_KEYS.category,
      endpoint: API.ADMIN.CONFIGURATION.STUDENT_CATEGORY.DROPDOWN,
    });
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.gender,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.Gender },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
    });
  }

  protected override buildGridConfig(): CommonDataGrid<Student> {
    const config = super.buildGridConfig();
    config.features = {
      ...config.features,
      showSearch: true,
      toolbar: {
        buttonConfig: [
          ...(this.permission().canExport ? [this.exportBtnConfig] : []),
          ...(this.permission().canImport ? [this.importBtnConfig] : [])
        ]
      },
      filter: {
        form: {
          formSection: [
            {
              controls: [
                {
                  control: {
                    ...getDropdownConfig(
                      'classSectionId',
                      SYSTEM_CONST.LABELS.ACADEMIC.CLASS,
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
                      'categoryId',
                      SYSTEM_CONST.LABELS.COMMON.CATEGORY,
                      this.categoryDropdownList()
                    ),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: getDateRangeConfig(
                    SYSTEM_CONST.LABELS.COMMON.DOB,
                    'dobFrom',
                    'dobTo',
                    null,
                    null,
                    null,
                    null,
                    () => CommonHelper.getDateByYear(100),
                    () => CommonHelper.getDateByYear(0)
                  ),
                  type: DynamicFormControlType.DateRangePicker,
                  class: 'col-12',
                },
                {
                  control: getRadioButtonConfig(
                    'gender',
                    SYSTEM_CONST.LABELS.COMMON.GENDER,
                    this.genderDropdownList()
                  ),
                  type: DynamicFormControlType.Radiobutton,
                  class: 'col-12',
                },
              ],
            },
          ],
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

  protected override get pageTitle(): string {
    if (this.authStore.isTeacher()) return TITLES.TEACHER.MY_STUDENTS;
    return `${TITLES.USER.STUDENT}`;
  }

  protected override get routeBasePath(): string {
    if (this.authStore.isTeacher()) return 'teacher/class-students';
    return `${this.authStore.roleRoutePath()}/user/students`;
  }

  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: Student) => SYSTEM_CONST.ACTIONS.CONFIRM_USER_ACTION('delete', row.fullName || row.firstName, 'account', 'Student');

  defaultStudentName = signal(SYSTEM_CONST.LABELS.USER.STUDENT);

  @ViewChild('studentNameCell', { static: true }) studentNameCell!: TemplateRef<unknown>;

  protected override buildColumns = (): CommonDataGridColumnConfig<Student>[] => {
    const columns: CommonDataGridColumnConfig<Student>[] = [
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.STUDENT_ID,
        field: 'studentId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.ADMISSION_NUMBER,
        field: 'admissionNumber',
        fieldType: CommonDataGridFieldType.Link,
        hasPermission: this.permission().canView,
        callback: this.onViewClick,
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        field: 'fullName',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.studentNameCell,
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.CLASS,
        field: 'classSectionName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.CATEGORY,
        field: 'categoryName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.DOB,
        field: 'dob',
        fieldDataType: CommonDataGridFieldDataType.Date,
        displayFormat: CommonDateFormat.DDMMYYYY_WithSlash,
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.PHONE_NUMBER,
        field: 'phoneNumber',
        fieldDataType: CommonDataGridFieldDataType.PhoneNumber,
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.GENDER,
        field: 'genderName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true,
      },
    ];
    return columns;
  };

  protected override get extraActionButtons(): CommonDataGridActionButtonConfig<Student>[] {
    return [{
      buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
      matIconName: 'visibility',
      tooltipText: this.commonHelperService.handleButtonText(SYSTEM_CONST.LABELS.USER.STUDENT, ButtonType.View),
      callback: this.onViewClick,
      visibleCallback: () => this.permission().canView
    },];
  }

  private onViewClick = (row: Student): void => {
    this.router.navigate([...this.routeBasePath.split('/'), 'view', row.studentId]);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dropdownStore.resetState();
  }
}

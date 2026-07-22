import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, TemplateRef, ViewChild, effect, untracked, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
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
import { getDateRangeConfig, getDropdownConfig, getRadioButtonConfig } from '../../../../../shared/functions/config-function';
import { ExportConst, ExportService } from '../../../../../core/services/export.service';
import { buildGridListRequest } from '../../../../../shared/helpers/grid.helper';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { Teacher, TEACHER_CONST, teacherStore } from '../../../../admin/user/teacher/models/teacher.model';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';

@Component({
  selector: 'common-teacher-list',
  standalone: true,
  imports: [CommonModule, CommonDataGridComponent, MatButtonModule, SafeImageComponent],
  providers: [teacherStore],
  templateUrl: './teacher-list.html',
  styleUrl: './teacher-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherList extends GridBase<Teacher> implements OnInit, OnDestroy {
  protected readonly authStore = inject(AuthStore);
  protected override store = inject(teacherStore);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly exportService = inject(ExportService);
  private readonly academicYearHelper = inject(AcademicYearHelperService);

  private readonly DROPDOWN_KEYS = {
    contractType: 'teacherListContractType',
    gender: 'teacherListGender',
  } as const;

  readonly contractTypeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.contractType);
  readonly genderDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.gender);

  constructor() {
    super();
    this.registerDropdownReactivity('contractType', this.contractTypeDropdownList);
    this.registerDropdownReactivity('gender', this.genderDropdownList);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadDropdownData();
  }

  private loadDropdownData(): void {
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.contractType,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.ContractType },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
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

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dropdownStore.resetState();
  }

  exportBtnConfig = this.exportService.getExportButtonConfig(() => this.exportTeachers());
  importBtnConfig = this.exportService.getImportButtonConfig(() => ({
    title: TEACHER_CONST.IMPORT_TEACHERS,
    sampleFileEndpoint: API.SAMPLE_FILE.TEACHER,
    endpoint: API.IMPORT_FILE.TEACHER,
  }), () => {
    this.reloadList();
  });

  private exportTeachers(): void {
    const state = this.currentGridState();
    const payload = {
      ...buildGridListRequest<Teacher>({
        pageIndex: state.pageIndex,
        pageSize: state.pageSize,
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
      defaultFileName: ExportConst.FileName.TeacherList,
    });
  }
  protected override apiEndpoint = API.ADMIN.USER.TEACHER.LIST;
  protected override deleteEndpoint = API.ADMIN.USER.TEACHER.DELETE;
  protected override primaryKey: keyof Teacher = 'teacherId';
  protected override skipViewPermissionForEdit = true;
  protected override pageTitle = `${TITLES.USER.TEACHER}`;

  protected override get routeBasePath(): string {
    return `${this.authStore.roleRoutePath()}/user/teachers`;
  }

  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: Teacher) =>
    SYSTEM_CONST.ACTIONS.CONFIRM_USER_ACTION('delete', row.fullName || row.firstName, 'account', 'Teacher');

  defaultTeacherName = signal(SYSTEM_CONST.LABELS.USER.TEACHER);

  @ViewChild('teacherNameCell', { static: true }) teacherNameCell!: TemplateRef<unknown>;

  protected override buildGridConfig(): CommonDataGrid<Teacher> {
    const config = super.buildGridConfig();
    config.features = {
      ...config.features,
      showSearch: true,
      toolbar: !this.authStore.isStudent() ? {
        buttonConfig: [
          ...(this.permission().canExport ? [this.exportBtnConfig] : []),
          ...(this.permission().canImport ? [this.importBtnConfig] : [])
        ]
      } : undefined,
      filter: {
        form: {
          formSection: [
            {
              controls: [
                {
                  control: {
                    ...getDropdownConfig(
                      'contractType',
                      SYSTEM_CONST.LABELS.ACADEMIC.CONTRACT,
                      this.contractTypeDropdownList()
                    ),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: getDateRangeConfig(
                    SYSTEM_CONST.LABELS.ACADEMIC.JOINING_DATE,
                    'joiningDateFrom',
                    'joiningDateTo',
                    null,
                    null,
                    null,
                    null,
                    () => CommonHelper.getDateByYear(100),
                    () => CommonHelper.getDateByYear(-1)
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

  protected override buildColumns = (): CommonDataGridColumnConfig<Teacher>[] => {
    return [
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.TEACHER_ID,
        field: 'teacherId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.CODE,
        field: 'teacherCode',
        fieldType: CommonDataGridFieldType.Link,
        hasPermission: this.permission().canView && !this.authStore.isStudent(),
        callback: this.onViewClick,
        isSortable: true,
        isHidden: this.authStore.isStudent()
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        field: 'fullName',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.teacherNameCell,
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT,
        field: 'classSubjectName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.EMAIL,
        field: 'email',
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
        title: SYSTEM_CONST.LABELS.ACADEMIC.CONTRACT,
        field: 'contractTypeName',
        isSortable: true,
        isHidden: this.authStore.isStudent()
      },
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.JOINING_DATE,
        field: 'joiningDate',
        fieldDataType: CommonDataGridFieldDataType.Date,
        isSortable: true,
        isHidden: this.authStore.isStudent()
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true,
        isHidden: this.authStore.isStudent(),
      },
    ];
  };

  protected override get extraActionButtons(): CommonDataGridActionButtonConfig<Teacher>[] {
    return [
      {
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
        matIconName: 'visibility',
        tooltipText: this.commonHelperService.handleButtonText(SYSTEM_CONST.LABELS.USER.TEACHER, ButtonType.View),
        callback: this.onViewClick,
        visibleCallback: () => this.permission().canView && !this.authStore.isStudent()
      },
    ];
  }

  private onViewClick = (row: Teacher): void => {
    this.router.navigate([...this.routeBasePath.split('/'), 'view', row.teacherId]);
  }
}

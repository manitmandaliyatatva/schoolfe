import { Component, OnDestroy, OnInit, TemplateRef, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { BooleanStatusComponent } from '../../../../../shared/components/boolean-status/boolean-status.component';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import {
  CommonDataGrid,
  CommonDataGridActionButtonConfig,
  CommonDataGridColumnConfig,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { getDateRangeConfig, getDropdownConfig } from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { FeeStructure, FeeStructureConst, feeStructureStore, publishFeeStructureStore } from '../model/fee-structure.model';

@UntilDestroy()
@Component({
  selector: 'app-fee-structure-list',
  imports: [CommonDataGridComponent, BooleanStatusComponent],
  templateUrl: './fee-structure-list.html',
})
export class FeeStructureList extends GridBase<FeeStructure> implements OnInit, OnDestroy {
  readonly booleanStatusTemplate = viewChild<TemplateRef<any>>('booleanStatus');

  private readonly DROPDOWN_KEYS = {
    class: 'feeStructureClass',
    feeType: 'feeStructureFeeType',
  } as const;

  private readonly isGenerateRequested = signal(false);

  protected override store = inject(feeStructureStore);
  private readonly publishFeeStructureStore = inject(publishFeeStructureStore);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly academicYearHelper = inject(AcademicYearHelperService);

  readonly classDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.class);
  readonly feeTypeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.feeType);

  constructor() {
    super();
    this.registerDropdownReactivity('classId', this.classDropdownList);
    this.registerDropdownReactivity('feeTypeId', this.feeTypeDropdownList);

    effect(() => {
      if (!this.isGenerateRequested() || !this.publishFeeStructureStore.isSuccess()) return;
      this.isGenerateRequested.set(false);
      this.reloadList();
    });
  }
  protected override apiEndpoint: string = API.ADMIN.FEE.FEE_STRUCTUER.LIST;
  protected override deleteEndpoint: string = API.ADMIN.FEE.FEE_STRUCTUER.DELETE;
  protected override primaryKey: keyof FeeStructure = 'feeStructureId';
  protected override pageTitle: string = TITLES.FEE.FEE_STRUCTURE;
  protected override routeBasePath: string = "admin/fee/fee-structures";
  protected override disableActionsInPastAcademicYear = true;
  protected override allowEditOnPastYear = false;
  protected override deleteConfirmTitle: string = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: FeeStructure) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.feeTypeName);

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
        (controlConfig.control as any).data = options;
        controlConfig.control = { ...controlConfig.control };
      }
    }
    this.gridConfig = { ...this.gridConfig };
  }

  private loadDropdownData(): void {
    this.dropdownStore.getDropdown<any>({
      key: this.DROPDOWN_KEYS.class,
      endpoint: API.CLASS.GET_CLASS_DROPDOWN,
    });
    this.dropdownStore.getDropdown<any>({
      key: this.DROPDOWN_KEYS.feeType,
      endpoint: API.ADMIN.FEE.FEE_TYPE.DROPDOWN,
    });
  }

  protected override buildGridConfig(): CommonDataGrid<FeeStructure> {
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
                      'classId',
                      SYSTEM_CONST.LABELS.ACADEMIC.CLASS,
                      this.classDropdownList()
                    ),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: {
                    ...getDropdownConfig(
                      'feeTypeId',
                      SYSTEM_CONST.LABELS.FEE.FEE_TYPE,
                      this.feeTypeDropdownList()
                    ),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: getDateRangeConfig(
                    SYSTEM_CONST.LABELS.COMMON.START_DATE,
                    'startDateFrom',
                    'startDateTo',
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
                    SYSTEM_CONST.LABELS.COMMON.END_DATE,
                    'endDateFrom',
                    'endDateTo',
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
                    () => this.academicYearHelper.getDatepickerMaxDate()
                  ),
                  type: DynamicFormControlType.DateRangePicker,
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

  protected override buildColumns(): CommonDataGridColumnConfig<FeeStructure>[] {
    return [
      {
        field: 'feeStructureId',
        isHidden: true,
        title: FeeStructureConst.FEE_STRUCTURE_ID
      },
      {
        field: 'feeTypeName',
        title: SYSTEM_CONST.LABELS.FEE.FEE_TYPE,
        isSortable: true
      },
      {
        field: 'className',
        title: SYSTEM_CONST.LABELS.ACADEMIC.CLASS,
        isSortable: true
      },
      {
        field: 'amount',
        title: SYSTEM_CONST.LABELS.COMMON.AMOUNT,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Currency
      },
      {
        field: 'startDate',
        title: SYSTEM_CONST.LABELS.COMMON.START_DATE,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date
      },
      {
        field: 'endDate',
        title: SYSTEM_CONST.LABELS.COMMON.END_DATE,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date
      },
      {
        field: 'dueDate',
        title: SYSTEM_CONST.LABELS.COMMON.DUE_DATE,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date
      },
      {
        field: 'isPublished',
        title: FeeStructureConst.PUBLISH,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.booleanStatusTemplate()
      },
      {
        field: 'isActive',
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        isSortable: true
      },
    ]
  }

  protected override get extraActionButtons(): CommonDataGridActionButtonConfig<FeeStructure>[] {
    const today = CommonHelper.toDateOnly(new Date().toString())
    return [
      {
        matIconName: 'publish',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.PUBLISH,
        callback: this.onGenerateClick,
        visibleCallback: (row) => !row.isPublished && this.permission().canUpdate && row.endDate >= today && this.isActionAllowed,
      },
    ];
  }

  onGenerateClick = (row: FeeStructure): void => {
    this.confirmService
      .confirm({
        title: SYSTEM_CONST.ACTION_BUTTONS.PUBLISH,
        message: SYSTEM_CONST.ACTIONS.CONFIRM_PUBLISH(row.feeTypeName || ''),
        confirmText: SYSTEM_CONST.ACTION_BUTTONS.PUBLISH,
        cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
      })
      .pipe(untilDestroyed(this))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.isGenerateRequested.set(true);
        this.publishFeeStructureStore.create({
          endpoint: API.ADMIN.FEE.FEE_STRUCTUER.GENERATE,
          body: { feeStructureId: row.feeStructureId },
        });
      });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dropdownStore.resetState();
  }
}

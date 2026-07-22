import { Component, inject, OnInit, TemplateRef, viewChild } from "@angular/core";
import { SYSTEM_CONST } from "../../../../../core/constants/system.constant";
import { EMPTY_GUID } from "../../../../../shared/constants/app.constants";
import { BooleanStatusComponent } from "../../../../../shared/components/boolean-status/boolean-status.component";
import { CommonDataGridComponent } from "../../../../../shared/components/common-data-grid/common-data-grid.component";
import { CommonDataGridFieldDataType } from "../../../../../shared/components/common-data-grid/enums/grid.enum";
import { CommonDataGridActionButtonConfig, CommonDataGridColumnConfig } from "../../../../../shared/components/common-data-grid/model/common-data-grid.model";
import { GridBase } from "../../../../../shared/components/grid-base/grid-base";
import { API } from "../../../../../shared/constants/api-url";
import { FeePaymentStatus, isFeeStatusPaid } from "../../../../../shared/constants/fee-status-type.constant";
import { TITLES } from "../../../../../shared/constants/title.constant";
import { buildGridListRequest } from "../../../../../shared/helpers/grid.helper";
import { FeeFilterComponent, FeeFilterValues } from "../../common/fee-filter/fee-filter.component";
import { FeeStatusChipComponent } from "../../student-fee/common/fee-status-chip/fee-status-chip.component";
import { StudentFeeDialogService } from "../../student-fee/services/student-fee-dialog.service";
import { FeeAdjustment, FeeAdjustmentConst, FeeAdjustmentListRequest, feeAdjustmentStore } from "../model/fee-adjustment.model";

@Component({
  selector: 'app-fee-adjustment-list',
  standalone: true,
  imports: [CommonDataGridComponent, BooleanStatusComponent, FeeFilterComponent, FeeStatusChipComponent],
  templateUrl: './fee-adjustment-list.html',
  providers: [feeAdjustmentStore]
})
export class FeeAdjustmentList extends GridBase<FeeAdjustment> implements OnInit {
  readonly defaultFeeStatusId = FeePaymentStatus.Unpaid;
  private filterValues: FeeFilterValues | null = null;

  readonly booleanStatusTemplate = viewChild<TemplateRef<any>>('booleanStatus');
  readonly statusTemplate = viewChild<TemplateRef<any>>('statusTemplate');

  protected override store: any = inject(feeAdjustmentStore);

  protected override apiEndpoint: string = API.ADMIN.FEE.FEE_ADJUSTMENT.LIST;
  protected override deleteEndpoint: string = API.ADMIN.FEE.FEE_ADJUSTMENT.DELETE;
  protected override primaryKey: keyof FeeAdjustment = 'feeAdjustmentId';
  protected override pageTitle: string = TITLES.FEE.FEE_ADJUSTMENT;
  protected override routeBasePath: string = 'admin/fee/fee-adjustments';
  protected override deleteConfirmTitle: string = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: FeeAdjustment) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.adjustmentTypeName || "Fee Adjustment");

  private readonly studentFeeService = inject(StudentFeeDialogService);

  constructor() {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.patchGridLoadWithFilters();
  }

  override reloadList = (): void => {
    const state = this.currentGridState();
    this.store.getAll({
      endpoint: this.apiEndpoint,
      body: this.buildListRequestBody({
        pageIndex: state.pageIndex,
        pageSize: state.pageSize,
        defaultSortingColumn: state.sortColumn,
        sortOrder: state.sortOrder,
        generalSearch: state.generalSearch,
      } as any),
    });
  };

  private patchGridLoadWithFilters = (): void => {
    if (!this.gridConfig?.signalStore) return;
    this.gridConfig.signalStore.load = (filter: any): void => {
      this.onGridStateChange(filter);

      this.store.getAll({
        endpoint: this.apiEndpoint,
        body: this.buildListRequestBody(filter),
      });
    };
  };

  private buildListRequestBody = (filter: any): FeeAdjustmentListRequest => {
    return {
      ...buildGridListRequest<FeeAdjustment>(filter),
      feeTypeId: this.filterValues?.feeTypeId ?? EMPTY_GUID,
      adjustmentType: this.filterValues?.adjustmentType ?? 0,
      feeStatus: this.filterValues?.status ?? 0,
    };
  };

  onSearch = (values: FeeFilterValues): void => {
    this.filterValues = values;
    this.resetGridAndReload(values);
  };

  onClear = (values: FeeFilterValues): void => {
    this.filterValues = values;
    this.resetGridAndReload(null);
  };

  private resetGridAndReload = (extraFilters: FeeFilterValues | null): void => {
    const nextState = { ...this.currentGridState(), pageIndex: 0, extraFilters: extraFilters ?? undefined };
    this.currentGridState.set(nextState);
    this.gridStateStore.setState(this.pageKey, nextState);
    this.reloadList();
  };

  override onAddClick = (): void => {
    if (!this.permission().canCreate) return;
    this.studentFeeService.openAdjustmentDialog({
      feeStudentId: null,
      studentName: '',
      onSave: () => this.reloadList()
    });
  };

  override onEditClick = (row: FeeAdjustment): void => {
    if (!this.permission().canView && !this.permission().canUpdate) return;
    this.studentFeeService.openAdjustmentDialog({
      feeAdjustmentId: row.feeAdjustmentId,
      feeStudentId: row.feeStudentId,
      studentName: row.studentName || '',
      feeTypeName: row.feeTypeName,
      feeStatus: row.feeStatus,
      onSave: () => this.reloadList()
    });
  };

  override get baseActionButtons(): CommonDataGridActionButtonConfig<FeeAdjustment>[] {
    return [
      {
        matIconName: 'edit',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
        callback: this.onEditClick,
        visibleCallback: () => this.permission().canUpdate || this.permission().canView,
      },
      {
        matIconName: 'delete',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        callback: this.onDeleteClick,
        visibleCallback: (data) => this.permission().canDelete && !isFeeStatusPaid(data.feeStatus),
      },
    ];
  }

  protected override buildColumns(): CommonDataGridColumnConfig<FeeAdjustment>[] {
    return [
      {
        field: 'feeAdjustmentId',
        isHidden: true,
        title: FeeAdjustmentConst.ID
      },
      {
        field: 'studentName',
        title: FeeAdjustmentConst.STUDENT_NAME,
        isSortable: true
      },
      {
        field: 'feeTypeName',
        title: SYSTEM_CONST.LABELS.FEE.FEE_TYPE,
        isSortable: true
      },
      {
        field: 'adjustmentTypeName',
        title: SYSTEM_CONST.LABELS.FEE.ADJUSTMENT_TYPE,
        isSortable: true
      },
      {
        field: 'amount',
        title: SYSTEM_CONST.LABELS.COMMON.AMOUNT,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Currency
      },
      {
        field: 'remarks',
        title: SYSTEM_CONST.LABELS.COMMON.REMARKS,
        isSortable: true
      },
      {
        field: 'feeStatus',
        title: SYSTEM_CONST.LABELS.FEE.FEE_STATUS,
        isSortable: false,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.statusTemplate(),
      }
    ];
  }
}

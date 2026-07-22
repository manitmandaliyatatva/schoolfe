import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { studentFeeStore, StudentFee, StudentFeeConst, StudentFeeListRequest } from '../model/student-fee.model';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGridSortDirection } from '../../../../../shared/components/common-data-grid/types/grid.type';
import { FeeStatusChipComponent } from '../common/fee-status-chip/fee-status-chip.component';
import { FeePaymentStatus, isFeeStatusPaid } from '../../../../../shared/constants/fee-status-type.constant';
import { buildGridListRequest } from '../../../../../shared/helpers/grid.helper';
import { StudentFeeDialogService } from '../services/student-fee-dialog.service';
import { CommonDataGridActionButtonConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { FeeAdjustmentConst, FeeAdjustmentRoute } from '../../fee-adjustment/model/fee-adjustment.model';
import { FeeFilterComponent, FeeFilterValues } from '../../common/fee-filter/fee-filter.component';

@Component({
  selector: 'app-student-fee-list',
  standalone: true,
  imports: [CommonDataGridComponent, FeeStatusChipComponent, FeeFilterComponent],
  templateUrl: './student-fee-list.html',
  styleUrl: './student-fee-list.scss',
})
export class StudentFeeList extends GridBase<StudentFee> implements OnInit {
  readonly defaultFeeStatusId = FeePaymentStatus.Unpaid;
  private filterValues: FeeFilterValues | null = null;

  protected override store = inject(studentFeeStore);

  protected override apiEndpoint: string = API.ADMIN.FEE.STUDENT_FEE.LIST;
  protected override deleteEndpoint: string = '';
  protected override primaryKey: keyof StudentFee = 'feeStudentId';
  protected override pageTitle: string = TITLES.FEE.STUDENT_FEE;
  protected override routeBasePath: string = "admin/fee/student-fees";
  protected override deleteConfirmTitle: string = '';
  protected override deleteConfirmMessage = (row: StudentFee) => '';
  protected override defaultSortColumn: string = 'dueDate';
  protected override defaultSortOrder: CommonDataGridSortDirection = 'asc';
  protected override showAddButton = false;

  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<unknown>;

  constructor() {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.patchGridLoadWithFilters();
  }

  override onEditClick = (row: StudentFee): void => {
    if (!this.permission().canView && !this.permission().canUpdate) return;
    this.router.navigate([...this.routeBasePath.split('/'), 'edit', row.studentId]);
  }

  protected override buildColumns(): CommonDataGridColumnConfig<StudentFee>[] {
    return [
      {
        field: 'feeStudentId',
        isHidden: true,
        title: StudentFeeConst.FEE_STUDENT_ID
      },
      {
        field: 'studentName',
        title: SYSTEM_CONST.LABELS.USER.STUDENT,
        isSortable: true
      },
      {
        field: 'feeTypeName',
        title: SYSTEM_CONST.LABELS.FEE.FEE_TYPE,
        isSortable: true
      },
      {
        field: 'amount',
        title: SYSTEM_CONST.LABELS.COMMON.AMOUNT,
        fieldDataType: CommonDataGridFieldDataType.Currency,
        isSortable: true
      },
      {
        field: 'paidAmount',
        title: SYSTEM_CONST.LABELS.FEE.PAID_AMOUNT,
        fieldDataType: CommonDataGridFieldDataType.Currency,
        isSortable: true
      },
      {
        field: 'remainingAmount',
        title: SYSTEM_CONST.LABELS.FEE.REMAINING_AMOUNT,
        fieldDataType: CommonDataGridFieldDataType.Currency,
        isSortable: true
      },
      {
        field: 'dueDate',
        title: SYSTEM_CONST.LABELS.COMMON.DUE_DATE,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date
      },
      {
        field: 'status',
        title: SYSTEM_CONST.LABELS.FEE.FEE_STATUS,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.statusTemplate,
        isSortable: false
      },
    ];
  }

  protected override get baseActionButtons(): CommonDataGridActionButtonConfig<StudentFee>[] {
    return [
      {
        matIconName: 'edit',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
        callback: this.onEditClick,
        visibleCallback: () => this.permission().canUpdate || this.permission().canView,
      },
    ];
  }

  protected override get extraActionButtons(): CommonDataGridActionButtonConfig<StudentFee>[] {
    return [
      {
        matIconName: 'settings_backup_restore',
        buttonText: FeeAdjustmentConst.ADJUST_FEE,
        callback: this.onAdjustFeeClick,
        visibleCallback: (data) => !isFeeStatusPaid(data.status) && this.commonHelperService.getPermissionByPage(FeeAdjustmentRoute).canCreate,
      },
    ];
  }

  private readonly studentFeeService = inject(StudentFeeDialogService);

  onAdjustFeeClick = (row: StudentFee): void => {
    this.studentFeeService.openAdjustmentDialog({
      feeStudentId: row.feeStudentId,
      studentName: row.studentName,
      feeTypeName: row.feeTypeName,
      remainingAmount: row.remainingAmount,
      onSave: () => this.reloadList()
    });
  };

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

  private buildListRequestBody = (filter: any): StudentFeeListRequest => {
    return {
      ...buildGridListRequest<StudentFee>(filter),
      classId: this.filterValues?.classId ?? EMPTY_GUID,
      feeTypeId: this.filterValues?.feeTypeId ?? EMPTY_GUID,
      status: this.filterValues?.status ?? 0,
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
}

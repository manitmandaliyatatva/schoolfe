import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { studentFeePaymentDetailsStore, StudentFeePaymentDetails, StudentFeeListRequest, PaymentHistoryConst } from '../model/payment-history.model';
import { CommonDataGridColumnConfig, CommonDataGridActionButtonConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { buildGridListRequest } from '../../../../../shared/helpers/grid.helper';
import { FeeFilterComponent, FeeFilterValues } from '../../common/fee-filter/fee-filter.component';
import { SafeImageComponent } from '../../../../../shared/components/safe-image/safe-image.component';

@Component({
  selector: 'app-payment-history-list',
  standalone: true,
  imports: [CommonModule, CommonDataGridComponent, FeeFilterComponent, SafeImageComponent],
  templateUrl: './payment-history-list.html',
  styleUrl: './payment-history-list.scss',
})
export class PaymentHistoryList extends GridBase<StudentFeePaymentDetails> implements OnInit {
  protected readonly PaymentHistoryConst = PaymentHistoryConst;
  private filterValues: FeeFilterValues | null = null;

  protected override store = inject(studentFeePaymentDetailsStore);

  protected override apiEndpoint: string = API.ADMIN.FEE.FEE_PAYMENT.GET_STUDENTS_WITH_FEE_PAYMENTS;
  protected override deleteEndpoint: string = '';
  protected override primaryKey: keyof StudentFeePaymentDetails = 'studentId';
  protected override pageTitle: string = TITLES.FEE.PAYMENT_HISTORY;
  protected override routeBasePath: string = "admin/fee/payment-history";
  protected override deleteConfirmTitle: string = '';
  protected override deleteConfirmMessage = (row: StudentFeePaymentDetails) => '';
  protected override showAddButton = false;

  @ViewChild('studentNameCell', { static: true }) studentNameCell!: TemplateRef<unknown>;

  constructor() {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.patchGridLoadWithFilters();
  }

  override onEditClick = (row: StudentFeePaymentDetails): void => {
    if (!this.permission().canView && !this.permission().canUpdate) return;
    this.router.navigate([...this.routeBasePath.split('/'), 'history', row.studentId], {
      state: { studentName: row.fullName }
    });
  }

  protected override buildColumns(): CommonDataGridColumnConfig<StudentFeePaymentDetails>[] {
    return [
      {
        field: 'studentId',
        isHidden: true,
        title: SYSTEM_CONST.LABELS.ACADEMIC.STUDENT_ID
      },
      {
        field: 'fullName',
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.studentNameCell,
        isSortable: true
      },
      {
        field: 'admissionNumber',
        title: SYSTEM_CONST.LABELS.ACADEMIC.ADMISSION_NUMBER,
        isSortable: true
      },
      {
        field: 'classSectionName',
        title: SYSTEM_CONST.LABELS.ACADEMIC.CLASS,
        isSortable: true
      },
      {
        field: 'phoneNumber',
        title: SYSTEM_CONST.LABELS.COMMON.PHONE_NUMBER,
        fieldDataType: CommonDataGridFieldDataType.PhoneNumber,
        isSortable: true
      },
      {
        field: 'totalPaidAmount',
        title: SYSTEM_CONST.LABELS.FEE.PAID_AMOUNT,
        fieldDataType: CommonDataGridFieldDataType.Currency,
        isSortable: true
      },
      {
        field: 'lastPaymentDate',
        title: PaymentHistoryConst.LAST_PAYMENT_DATE,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date
      },
    ];
  }

  protected override get baseActionButtons(): CommonDataGridActionButtonConfig<StudentFeePaymentDetails>[] {
    return [
      {
        matIconName: 'visibility',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
        callback: this.onEditClick,
        visibleCallback: () => this.permission().canView,
      },
    ];
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
      }),
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
    const { filterData, ...gridFilter } = filter ?? {};
    return {
      ...buildGridListRequest<StudentFeePaymentDetails>(gridFilter),
      classId: this.filterValues?.classId ?? EMPTY_GUID,
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

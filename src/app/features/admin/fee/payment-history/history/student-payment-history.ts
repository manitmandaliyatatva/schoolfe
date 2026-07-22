import { Component, computed, inject, OnInit, signal, TemplateRef, ViewChild, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { feePaymentDetailsStore, FeePaymentDetails, FeePaymentHistoryRequest, PaymentHistoryConst, receiptBase64Store } from '../model/payment-history.model';
import { CommonDataGridColumnConfig, CommonDataGridActionButtonConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { buildGridListRequest } from '../../../../../shared/helpers/grid.helper';
import { AuthStore } from '../../../../../core/store/auth.store';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { getButtonConfig } from '../../../../../shared/functions/config-function';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import FileHelper from '../../../../../shared/helpers/file.helper';
import { Base64Document } from '../../../../../shared/models/document.model';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';

@Component({
  selector: 'app-student-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    CommonDataGridComponent,
    ButtonComponent,
  ],
  providers: [feePaymentDetailsStore, receiptBase64Store],
  templateUrl: './student-payment-history.html',
  styleUrl: './student-payment-history.scss',
})
export class StudentPaymentHistory extends GridBase<FeePaymentDetails> implements OnInit {
  protected readonly PaymentHistoryConst = PaymentHistoryConst;
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  protected readonly authStore = inject(AuthStore);
  protected override store = inject(feePaymentDetailsStore);

  private readonly genericDialogService = inject(GenericDialogService);
  readonly receiptBase64Store = inject(receiptBase64Store);
  private readonly pendingReceiptAction = signal<{ row: FeePaymentDetails; mode: 'view' | 'download' } | null>(null);

  override permission = computed(() => {
    const pageUrl = this.authStore.isStudent() ? "student/fee/payment-history" : "admin/fee/payment-history";
    return this.commonHelperService.getPermissionByPage(pageUrl);
  });

  protected override apiEndpoint: string = API.ADMIN.FEE.FEE_PAYMENT.GET_FEE_PAYMENT_HISTORY_LIST;
  protected override deleteEndpoint: string = '';
  protected override primaryKey: keyof FeePaymentDetails = 'feePaymentDetailId';
  protected override pageTitle: string = TITLES.FEE.PAYMENT_HISTORY;
  protected override routeBasePath: string = "admin/fee/payment-history";
  protected override deleteConfirmTitle: string = '';
  protected override deleteConfirmMessage = (row: FeePaymentDetails) => '';

  protected override showAddButton = false;

  protected override get baseActionButtons(): CommonDataGridActionButtonConfig<FeePaymentDetails>[] {
    return [
      {
        matIconName: 'visibility',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW_RECEIPT,
        callback: (row) => this.onViewReceipt(row),
        visibleCallback: () => this.permission().canView,
      },
      {
        matIconName: 'download',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.DOWNLOAD,
        callback: (row) => this.onDownloadReceipt(row),
        visibleCallback: () => this.permission().canDownload,
      },
    ];
  }

  readonly backBtnConfig = computed<CommonButtonConfig>(() => ({
    ...getButtonConfig(() => this.goBack(), 'stroked', 'primary', SYSTEM_CONST.ACTION_BUTTONS.BACK, false),
    cssClasses: ['btn', 'back-btn', 'secondary-btn'],
  }));

  studentId: string | null = null;
  studentName = signal<string>('');



  constructor() {
    super();
    effect(() => {
      const pendingAction = this.pendingReceiptAction();
      if (!pendingAction) return;
      if (this.receiptBase64Store.isLoading()) return;

      const base64Data = this.receiptBase64Store.data();
      this.pendingReceiptAction.set(null);
      if (!base64Data) return;

      const base64Str = base64Data.base64 || (base64Data as any).data;
      const normalizedBase64 = FileHelper.normalizeBase64(base64Str);
      const fileName = base64Data.fileName || `Receipt-${pendingAction.row.transactionRef || pendingAction.row.feePaymentDetailId}.pdf`;
      const contentType = FileHelper.resolveContentType(base64Data.contentType, fileName, base64Str);

      if (pendingAction.mode === 'download') {
        if (normalizedBase64) {
          FileHelper.downloadBase64(normalizedBase64, fileName, contentType);
        }
      } else {
        const viewerData: Base64Document = {
          base64: normalizedBase64,
          contentType: contentType,
          fileName: fileName
        };
        this.genericDialogService.openDocumentViewer(viewerData, fileName);
      }
    });
  }

  onViewReceipt = (row: FeePaymentDetails): void => {
    if (!row || !row.feePaymentId) return;
    this.pendingReceiptAction.set({ row, mode: 'view' });
    this.receiptBase64Store.resetState();
    this.receiptBase64Store.getById({
      endpoint: API.ADMIN.FEE.FEE_PAYMENT.GET_RECEIPT,
      params: { feePaymentId: row.feePaymentId }
    });
  };

  onDownloadReceipt = (row: FeePaymentDetails): void => {
    if (!row || !row.feePaymentId) return;
    this.pendingReceiptAction.set({ row, mode: 'download' });
    this.receiptBase64Store.resetState();
    this.receiptBase64Store.getById({
      endpoint: API.ADMIN.FEE.FEE_PAYMENT.GET_RECEIPT,
      params: { feePaymentId: row.feePaymentId }
    });
  };

  override ngOnInit(): void {
    if (!this.permission().canList) return;
    const routeStudentId = this.route.snapshot.paramMap.get('studentId');
    if (routeStudentId) {
      this.studentId = routeStudentId;
    } else if (this.authStore.isStudent()) {
      this.studentId = this.authStore.entityid();
    }

    const state = window.history.state;
    if (state && state.studentName) {
      this.studentName.set(state.studentName);
    } else if (this.authStore.isStudent()) {
      this.studentName.set(this.authStore.name() || '');
    }

    super.ngOnInit();

    this.patchGridLoadWithFilters();
  }

  goBack(): void {
    this.location.back();
  }


  protected override buildColumns(): CommonDataGridColumnConfig<FeePaymentDetails>[] {
    return [
      {
        field: 'feePaymentDetailId',
        isHidden: true,
        title: 'ID'
      },
      {
        field: 'feeTypeName',
        title: SYSTEM_CONST.LABELS.FEE.FEE_TYPE,
        isSortable: true
      },
      {
        field: 'paidAmount',
        title: SYSTEM_CONST.LABELS.FEE.PAID_AMOUNT,
        fieldDataType: CommonDataGridFieldDataType.Currency,
        isSortable: true
      },
      {
        field: 'paymentModeName',
        title: SYSTEM_CONST.LABELS.FEE.PAYMENT_MODE,
        isSortable: true
      },
      {
        field: 'paymentDate',
        title: PaymentHistoryConst.PAYMENT_DATE,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date,
      },
      {
        field: 'receivedByName',
        title: PaymentHistoryConst.RECEIVED_BY,
        isSortable: true
      },
      {
        field: 'transactionRef',
        title: PaymentHistoryConst.TRANSACTION_REF,
        isSortable: false
      },
      {
        field: 'remarks',
        title: SYSTEM_CONST.LABELS.COMMON.REMARKS,
        isSortable: false
      },
    ];
  }

  override reloadList = (): void => {
    if (!this.permission().canList) return;
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

  private buildListRequestBody = (filter: any): FeePaymentHistoryRequest => {
    const { filterData, ...gridFilter } = filter ?? {};
    return {
      ...buildGridListRequest<FeePaymentDetails>(gridFilter),
      studentId: this.studentId ?? EMPTY_GUID
    };
  };
}

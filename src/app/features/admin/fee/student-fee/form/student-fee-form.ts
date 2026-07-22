import { Component, inject, OnInit, computed, signal, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { API } from '../../../../../shared/constants/api-url';
import { AuthStore } from '../../../../../core/store/auth.store';
import { StudentFee, StudentFeeConst, studentFeeStore } from '../model/student-fee.model';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGrid, SelectionState } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDateFormat } from '../../../../../core/constants/date-format.constant';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { FeeAdjustmentBreakdownComponent } from './fee-adjustment-breakdown/fee-adjustment-breakdown.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { StudentFeeDialogService } from '../services/student-fee-dialog.service';
import { FeeAdjustmentConst, FeeAdjustmentRoute } from '../../fee-adjustment/model/fee-adjustment.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { getButtonConfig } from '../../../../../shared/functions/config-function';
import { PayFeesDialogComponent } from './pay-fees-dialog/pay-fees-dialog.component';
import { FeePayment, feePaymentStore, PayFeesDialogData, PayFeesDialogResult } from '../model/fee-payment.model';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { isFeeStatusPaid } from '../../../../../shared/constants/fee-status-type.constant';
import { CurrencyFormatPipe } from '../../../../../shared/pipes/currency-format.pipe';
import { FeeStatusChipComponent } from '../common/fee-status-chip/fee-status-chip.component';
import { StripeFeePayment } from '../model/stripe-payment.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import CommonHelper from '../../../../../core/helpers/common-helper';

@UntilDestroy()
@Component({
  selector: 'app-student-fee-form',
  standalone: true,
  imports: [CommonModule, CommonDataGridComponent, ButtonComponent, FeeStatusChipComponent, CurrencyFormatPipe],
  templateUrl: './student-fee-form.html',
  styleUrl: './student-fee-form.scss',
  providers: [CurrencyFormatPipe]
})
export class StudentFeeForm implements OnInit, OnDestroy {

  protected readonly SYSTEM_CONST = SYSTEM_CONST;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
  @ViewChild('adjustmentTemplate', { static: true }) adjustmentTemplate!: TemplateRef<any>;
  @ViewChild('dataGrid') dataGrid!: CommonDataGridComponent<StudentFee>;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly studentFeeStore = inject(studentFeeStore);
  private readonly feePaymentStore = inject(feePaymentStore);
  private readonly dialogService = inject(GenericDialogService);
  private readonly studentFeeService = inject(StudentFeeDialogService);
  private readonly authStore = inject(AuthStore);
  private readonly commonHelperService = inject(CommonHelperService);

  readonly permission = computed(() => this.commonHelperService.getPermissionByPage(this.authStore.isStudent() ? 'student/fee/student-fees' : 'admin/fee/student-fees'));

  protected readonly isFeeStatusPaid = isFeeStatusPaid;

  readonly feeData = this.studentFeeStore.list;
  readonly isLoading = this.studentFeeStore.isLoading;

  readonly totalPayable = computed(() => this.feeData().reduce((acc, curr) => acc + (curr.amount || 0) + (curr.lateFeeAmount || 0), 0));
  readonly totalPaid = computed(() => this.feeData().reduce((acc, curr) => acc + (curr.paidAmount || 0), 0));
  readonly totalOutstanding = computed(() => this.feeData().reduce((acc, curr) => acc + (curr.remainingAmount || 0), 0));
  readonly studentName = computed(() => this.feeData().length > 0 ? this.feeData()[0].studentName : '');
  readonly studentId = signal<string | null>(null);
  readonly selectedIncludedRows = signal<StudentFee[]>([]);
  readonly selectedExcludedRows = signal<StudentFee[]>([]);
  readonly selectedMasterState = signal<SelectionState>('notSelected');

  readonly isAdminUser = this.authStore.isAdmin();

  readonly backBtnConfig = computed<CommonButtonConfig>(() => ({
    ...getButtonConfig(() => this.onBack(), 'stroked', 'primary', SYSTEM_CONST.ACTION_BUTTONS.BACK, false),
    cssClasses: ['btn', 'back-btn', 'secondary-btn'],
  }));
  readonly isPayFeesDisabled = computed(() => this.resolveSelectedFeeRows().length === 0);

  readonly payFeesBtnConfig = computed<CommonButtonConfig>(() => ({
    ...getButtonConfig(() => this.onPayFees(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.PAY_FEES, null, this.isPayFeesDisabled),
    cssClasses: ['btn'],
  }));

  readonly refreshBtnConfig = computed<CommonButtonConfig>(() => (CommonHelper.getRefreshButtonConfig(
    () => {
      const studentId = this.studentId();
      if (studentId) {
        this.fetchFeeData(studentId);
      }
    }
  )));

  gridConfig!: CommonDataGrid<StudentFee>;

  ngOnInit() {
    if (!this.permission().canList) return;
    this.initGridConfig();
    let studentId = this.route.snapshot.paramMap.get('feeStudentId');

    // Fallback to logged-in user if student ID is missing from route
    if (!studentId && this.authStore.isStudent()) {
      studentId = this.authStore.entityid();
    }

    this.studentId.set(studentId);

    if (studentId) {
      this.fetchFeeData(studentId);
    }
  }

  private initGridConfig = (): void => {

    this.gridConfig = {
      columns: [
        { title: StudentFeeConst.FEE_TYPE, field: 'feeTypeName' },
        {
          title: SYSTEM_CONST.LABELS.COMMON.AMOUNT,
          field: 'amount',
          fieldDataType: CommonDataGridFieldDataType.Currency,
        },
        {
          title: SYSTEM_CONST.LABELS.COMMON.DUE_DATE,
          field: 'dueDate',
          fieldDataType: CommonDataGridFieldDataType.Date,
          displayFormat: CommonDateFormat.DDMMYYYY_WithSlash
        },
        {
          title: SYSTEM_CONST.LABELS.FEE.LATE_FEE_AMOUNT,
          field: 'lateFeeAmount',
          fieldDataType: CommonDataGridFieldDataType.Currency,
        },
        {
          title: SYSTEM_CONST.LABELS.FEE.PAID_AMOUNT,
          field: 'paidAmount',
          fieldDataType: CommonDataGridFieldDataType.Currency,
        },
        {
          title: SYSTEM_CONST.LABELS.FEE.REMAINING_AMOUNT,
          field: 'remainingAmount',
          fieldDataType: CommonDataGridFieldDataType.Currency,
        },
        {
          title: SYSTEM_CONST.LABELS.FEE.ADJUSTMENT_AMOUNT,
          field: 'adjustedAmount',
          fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
          customRenderCell: this.adjustmentTemplate
        },
        {
          title: SYSTEM_CONST.LABELS.COMMON.STATUS,
          field: 'status',
          fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
          customRenderCell: this.statusTemplate
        },
      ],
      actionButtons: [
        {
          matIconName: 'payments',
          buttonText: SYSTEM_CONST.ACTION_BUTTONS.PAY_FEES,
          callback: (row) => this.onIndividualPay(row),
          visibleCallback: (data) => this.permission().canCreate && !isFeeStatusPaid(data.status),
        },
        {
          matIconName: 'settings_backup_restore',
          buttonText: FeeAdjustmentConst.ADJUST_FEE,
          callback: (row) => this.onAdjustFeeClick(row),
          visibleCallback: (data) => !isFeeStatusPaid(data.status) && (this.isAdminUser || !this.authStore.isStudent()) && this.commonHelperService.getPermissionByPage(FeeAdjustmentRoute).canCreate,
        }
      ],
      data: this.toGridRows(this.feeData()),
      checkboxConfig: {
        showCheckboxSelection: true,
        showMasterCheckBox: true,
        getSelectedRows: (includedData, excludedData, masterCheckboxState) => {
          this.selectedIncludedRows.set(includedData || []);
          this.selectedExcludedRows.set(excludedData || []);
          this.selectedMasterState.set(masterCheckboxState);
        },
        disableCallBack: (data) => isFeeStatusPaid(data.status)
      },
      features: {
        showSearch: false,
        toolbar: {
          buttonConfig: [this.refreshBtnConfig()]
        }
      }
    };
  }

  showAdjustmentBreakdown = (row: StudentFee): void => {
    if (!row.adjustedAmountList || row.adjustedAmountList.length === 0) {
      return;
    }

    this.dialogService.open({
      title: `${row.feeTypeName} ${StudentFeeConst.ADJUSTMENTS_BREAKDOWN}`,
      component: FeeAdjustmentBreakdownComponent,
      data: row.adjustedAmountList,
      maxWidth: '500px'
    });
  }

  onAdjustFeeClick = (row: StudentFee): void => {
    this.studentFeeService.openAdjustmentDialog({
      feeStudentId: row.feeStudentId,
      studentName: row.studentName || this.studentName(),
      feeTypeName: row.feeTypeName,
      remainingAmount: row.remainingAmount,
      onSave: () => this.fetchFeeData(String(this.studentId()))
    });
  };

  private fetchFeeData = (studentId: string): void => {
    if (!this.permission().canList) return;
    this.dataGrid?.resetMasterCheckBox();
    this.studentFeeStore.getWithResult<StudentFee[]>({
      endpoint: API.ADMIN.FEE.STUDENT_FEE.GET_BY_STUDENT_ID,
      params: { studentId: studentId }
    }).pipe(untilDestroyed(this)).subscribe({
      next: (rows) => {
        this.gridConfig = { ...this.gridConfig, data: this.toGridRows(rows || []) };
      }
    });
  }

  private toGridRows = (rows: StudentFee[]): StudentFee[] => {
    return rows.map(row => ({ ...row, id: row.feeStudentId } as StudentFee));
  }

  onBack = (): void => {
    this.router.navigate(['admin', 'fee', 'student-fees']);
  }

  onIndividualPay = (row: StudentFee): void => {
    if (!this.isAdminUser) {
      this.handleStudentPayFees([row]);
      return;
    }

    this.handleAdminPayFees([row]);
  }

  onPayFees = (): void => {
    if (!this.isAdminUser) {
      this.handleStudentPayFees();
      return;
    }

    this.handleAdminPayFees();
  };

  private handleStudentPayFees = (rows?: StudentFee[]) => {
    const allRows = this.feeData();
    if (!allRows.length) {
      return;
    }

    const feesToPay = rows || this.resolveSelectedFeeRows();
    if (!feesToPay.length) {
      return;
    }

    const total = feesToPay.reduce((sum, row) => sum + Number(row.remainingAmount || 0), 0);
    const feeIds = feesToPay.map((row) => row.feeStudentId);

    const dialogData: PayFeesDialogData<StripeFeePayment> = {
      fees: feesToPay,
      stripeConfig: {
        amount: total,
        paymentIntentEndpoint: API.ADMIN.FEE.FEE_PAYMENT.CREATE_PAYMENT_INTENT,
        payerName: this.studentName(),
        payload: {
          studentId: this.studentId(),
          feeStudentIds: feeIds
        },
        silentSuccess: true
      },
      onSave: (result) => this.onPayFeesSubmit(result),
    };

    this.dialogService.open({
      width: '900px',
      disableClose: true,
      title: SYSTEM_CONST.ACTION_BUTTONS.PAY_FEES,
      component: PayFeesDialogComponent,
      data: dialogData,
    });
  };

  private handleAdminPayFees = (rows?: StudentFee[]) => {
    const allRows = this.feeData();
    if (!allRows.length) {
      return;
    }

    const feesToPay = rows || this.resolveSelectedFeeRows();
    if (!feesToPay.length) {
      return;
    }

    const dialogData: PayFeesDialogData = {
      fees: feesToPay,
      onSave: (result) => this.onPayFeesSubmit(result),
    };

    this.dialogService.open({
      width: '900px',
      disableClose: true,
      title: SYSTEM_CONST.ACTION_BUTTONS.PAY_FEES,
      component: PayFeesDialogComponent,
      data: dialogData,
    });
  };

  private onPayFeesSubmit = (_result: PayFeesDialogResult): void => {
    const payload: FeePayment = {
      feePaymentId: EMPTY_GUID,
      studentId: this.studentId(),
      totalAmount: Number(_result.totalAmount ?? 0),
      paymentMode: Number(_result.paymentMode ?? 0),
      transactionRef: _result.transactionId,
      remarks: _result.remarks,
      receivedBy: this.authStore.userId() ?? null,
      isActive: true,
      feeStudentsIDList: _result.feeStudentIds ?? [],
    };

    this.feePaymentStore.createWithResult({
      endpoint: API.ADMIN.FEE.FEE_PAYMENT.ADDUPDATE,
      body: payload,
    }).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.fetchFeeData(String(payload.studentId));
      }
    });
  };

  private resolveSelectedFeeRows = (): StudentFee[] => {
    const allRows = this.feeData();
    const includedRows = this.selectedIncludedRows();
    const excludedRows = this.selectedExcludedRows();
    const state = this.selectedMasterState();

    if (state === 'checked') {
      return allRows.filter((row) => !excludedRows.some((excluded) => excluded.feeStudentId === row.feeStudentId));
    }

    if (state === 'intermediate') {
      if (excludedRows.length > 0) {
        return allRows.filter((row) => !excludedRows.some((excluded) => excluded.feeStudentId === row.feeStudentId));
      }
      return includedRows;
    }

    return includedRows;
  };

  ngOnDestroy(): void {
    this.studentFeeStore.resetState();
    this.feePaymentStore.resetState();
  }
}


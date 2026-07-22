import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { CurrencyFormatPipe } from '../../../../../../shared/pipes/currency-format.pipe';
import { PaymentMode } from '../../../../../../shared/constants/payment-mode.constant';
import { StripePaymentResult } from '../../../../../../shared/components/stripe-gateway-dialog/models/stripe-gateway.model';
import { StudentFee, StudentFeeConst } from '../../model/student-fee.model';
import { PayFeesDialogData, PayFeesDialogResult } from '../../model/fee-payment.model';
import { AdminPaymentFormComponent } from '../admin-payment-form/admin-payment-form.component';
import { StripeGatewayDialogComponent } from '../../../../../../shared/components/stripe-gateway-dialog/stripe-gateway-dialog.component';

@Component({
  selector: 'app-pay-fees-dialog',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe, AdminPaymentFormComponent, StripeGatewayDialogComponent],
  templateUrl: './pay-fees-dialog.component.html',
  styleUrls: ['../../style/fee-breakdown-table.scss', './pay-fees-dialog.component.scss'],
})
export class PayFeesDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<any, boolean>);
  private readonly dialogData = inject<PayFeesDialogData>(MAT_DIALOG_DATA);

  protected readonly SYSTEM_CONST = SYSTEM_CONST;
  protected readonly data = this.getData();
  readonly paymentRows = signal<StudentFee[]>([]);
  readonly totalAmount = computed(() => {
    if (this.data.stripeConfig) {
      return this.data.stripeConfig.amount;
    }
    return this.paymentRows().reduce((sum, row) => sum + Number(row.remainingAmount || 0), 0);
  });

  ngOnInit(): void {
    this.paymentRows.set(this.data.fees ?? []);

    if (this.data.stripeConfig) {
      this.data.stripeConfig = {
        ...this.data.stripeConfig,
        isEmbedded: true,
        onSuccess: (res) => this.handleStripeSuccess(res),
        onCancel: () => this.onCancel()
      };
    }
  }

  handleAdminSave = (result: PayFeesDialogResult): void => {
    this.data.onSave?.(result);
    this.dialogRef.close(true);
  };

  handleStripeSuccess = (result: StripePaymentResult): void => {
    const finalizePayload: PayFeesDialogResult = {
      feeStudentIds: this.paymentRows().map((row) => String(row.feeStudentId)),
      totalAmount: this.totalAmount(),
      paymentMode: PaymentMode['Payment Gateway'],
      transactionId: result.transactionId,
      remarks: StudentFeeConst.PAID_VIA_COMMON_STRIPE_GATEWAY,
    };

    this.data.onSave?.(finalizePayload);
    this.dialogRef.close(true);
  };

  onCancel = (): void => {
    this.dialogRef.close(false);
  };

  private getData(): PayFeesDialogData {
    return this.dialogData || { fees: [], stripeConfig: null };
  }
}

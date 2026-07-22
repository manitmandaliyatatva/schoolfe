import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { StripeElementsOptions, StripePaymentElementOptions } from '@stripe/stripe-js';
import { StripePaymentElementComponent, StripeService } from 'ngx-stripe';
import { ToastrService } from 'ngx-toastr';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';
import { getButtonConfig, getTextboxConfig } from '../../../shared/functions/config-function';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { ButtonComponent } from '../button/button.component';
import { CommonButtonConfig } from '../button/model/button.model';
import { CommonTextboxConfig } from '../textbox/model/textbox.model';
import { TextboxComponent } from '../textbox/textbox.component';
import { StripeGatewayConfig, StripeGatewayConst, StripeGatewayDialogData, stripeGatewayStore, StripePaymentResult } from './models/stripe-gateway.model';

@UntilDestroy()
@Component({
  selector: 'app-stripe-gateway-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, CurrencyFormatPipe, StripePaymentElementComponent, TextboxComponent],
  templateUrl: './stripe-gateway-dialog.component.html',
  styleUrls: ['./stripe-gateway-dialog.component.scss'],
})
export class StripeGatewayDialogComponent implements OnInit {
  @ViewChild(StripePaymentElementComponent) paymentElement!: StripePaymentElementComponent;

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<any, boolean>, { optional: true });
  private readonly dialogData = inject<StripeGatewayDialogData>(MAT_DIALOG_DATA, { optional: true });
  private readonly toastr = inject(ToastrService);
  private readonly stripeService = inject(StripeService);
  private readonly stripeStore = inject(stripeGatewayStore);

  @Input() config: StripeGatewayConfig | null = null;

  totalAmount = signal<number>(0);
  isProcessing = signal<boolean>(false);
  isInitializing = signal<boolean>(true);
  clientSecret = signal<string | null>(null);
  readonly constants = StripeGatewayConst;

  readonly formGroup = this.fb.group({
    payerName: this.fb.control<string | null>(null, [Validators.required])
  });

  payerNameConfig: CommonTextboxConfig;

  readonly elementsOptions = computed<StripeElementsOptions | null>(() => {
    const clientSecret = this.clientSecret();

    if (!clientSecret) {
      return null;
    }

    const options: any = {
      locale: 'en',
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#1a9e8d',
        }
      },
      clientSecret: clientSecret
    };

    return options as StripeElementsOptions;
  });

  readonly paymentElementOptions: StripePaymentElementOptions = {
    layout: 'tabs',
  };

  readonly payBtn = computed<CommonButtonConfig>(() => ({
    ...getButtonConfig(() => this.onSave(), 'flat', 'primary', StripeGatewayConst.CONFIRM_PAYMENT, true),
    cssClasses: ['btn', 'stripe-pay-btn', 'w-100'],
    disabled: this.isProcessing() || this.isInitializing()
  }));

  readonly cancelBtn = computed<CommonButtonConfig>(() => ({
    ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn', 'w-100'],
    disabled: this.isProcessing()
  }));

  get isEmbedded(): boolean {
    return this.config?.isEmbedded || false;
  }

  ngOnInit(): void {
    const data = this.getComponentData();
    this.totalAmount.set(data.amount || 0);
    this.initPaymentIntent();

    if (data.payerName) {
      this.formGroup.patchValue({ payerName: data.payerName });
    }

    this.payerNameConfig = getTextboxConfig(StripeGatewayConst.PAYER_NAME, 'payerName');
  }

  private initPaymentIntent = () => {
    this.isInitializing.set(true);
    const data = this.getComponentData();

    this.stripeStore.createWithResult({
      endpoint: data.paymentIntentEndpoint,
      body: {
        amount: data.amount,
        ...data.payload
      }
    }).pipe(untilDestroyed(this)).subscribe({
      next: (response: any) => {
        if (response && response.clientSecret) {
          this.clientSecret.set(response.clientSecret);
          this.isInitializing.set(false);
        } else {
          this.toastr.error(StripeGatewayConst.FAILED_TO_INITIALIZE);
          this.close(false);
        }
      },
      error: (err) => {
        this.toastr.error(err.message || StripeGatewayConst.SERVER_ERROR_PREPARING);
        this.close(false);
      }
    });
  }

  onSave = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.isProcessing.set(true);

    this.stripeService.confirmPayment({
      elements: this.paymentElement.elements,
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: this.formGroup.value.payerName || ''
          }
        },
        return_url: window.location.href
      },
      redirect: 'if_required'
    }).subscribe((result) => {
      this.isProcessing.set(false);

      if (result.error) {
        this.toastr.error(result.error.message || StripeGatewayConst.PAYMENT_FAILED);
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        const data = this.getComponentData();
        if (!data.silentSuccess) {
          this.toastr.success(StripeGatewayConst.PAYMENT_PROCESSED_SUCCESS);
        }

        const res: StripePaymentResult = {
          transactionId: result.paymentIntent.id,
          rawResult: result.paymentIntent
        };

        data.onSuccess?.(res);
        this.close(true);
      }
    });
  };

  onCancel = (): void => {
    const data = this.getComponentData();
    data.onCancel?.();
    this.close(false);
  };

  private close(result: boolean) {
    if (this.dialogRef) {
      this.dialogRef.close(result);
    }
  }

  private getComponentData(): StripeGatewayDialogData {
    if (this.isEmbedded && this.config) {
      return {
        ...this.config,
        onSuccess: (res) => this.config?.onSuccess?.(res)
      } as StripeGatewayDialogData;
    }
    return this.dialogData ?? { amount: 0, paymentIntentEndpoint: '', payload: {}, onSuccess: () => { } };
  }
}

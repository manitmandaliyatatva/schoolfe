import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, signal, effect, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { PaymentMode } from '../../../../../../shared/constants/payment-mode.constant';
import { InputType } from '../../../../../../shared/Enums/common.enum';
import { getButtonConfig, getDropdownConfig, getTextboxConfig } from '../../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../../shared/models/form-control-base.model';
import { PayFeesDialogResult } from '../../model/fee-payment.model';
import { StudentFee } from '../../model/student-fee.model';
import { CommonDropdownStore } from '../../../../../../core/store/common-dropdown.store';
import { LookupMnemonics } from '../../../../../../shared/constants/lookup-type-ids.constant';
import { ITextValueOption } from '../../../../../../shared/models/common.model';
import { API } from '../../../../../../shared/constants/api-url';

@Component({
  selector: 'app-admin-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DynamicFormComponent, ButtonComponent],
  template: `
    <form [formGroup]="formGroup">
      <common-dynamic-form [formControls]="formControls()" [showCard]="false"></common-dynamic-form>

      <div class="form-actions configuration-screen-actions dialog-actions">
        <common-button [config]="cancelBtnConfig"></common-button>
        <common-button [config]="saveBtnConfig"></common-button>
      </div>
    </form>
  `,
  styles: [`
    .dialog-actions {
      margin-top: 24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  `]
})
export class AdminPaymentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly toastrService = inject(ToastrService);

  @Input() fees: StudentFee[] = [];
  @Output() onSave = new EventEmitter<PayFeesDialogResult>();
  @Output() onCancel = new EventEmitter<void>();

  private readonly DROPDOWN_KEYS = {
    paymentMode: 'paymentMode',
  } as const;

  readonly formControls = signal<DynamicForm>({ formSection: [] });
  readonly paymentModeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.paymentMode);
  paymentModeOptions: ITextValueOption[] = [];

  constructor() {
    effect(() => {
      const options = this.paymentModeDropdownList();
      untracked(() => {
        this.paymentModeOptions = options.filter((option) => Number(option.value) !== PaymentMode["Payment Gateway"]);
        this.setFormControls();
      });
    });
  }

  readonly formGroup = this.fb.group({
    totalAmount: this.fb.control({ value: 0, disabled: true }),
    paymentMode: this.fb.control<number | null>(null, Validators.required),
    transactionId: this.fb.control<string | null>(null, [Validators.maxLength(100)]),
    remarks: this.fb.control<string | null>(null, [Validators.maxLength(500)]),
  });

  readonly saveBtnConfig = {
    ...getButtonConfig(() => this.handleSubmit(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true),
    cssClasses: ['btn', 'primary-btn'],
  };

  readonly cancelBtnConfig = {
    ...getButtonConfig(() => this.onCancel.emit(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn'],
  };

  ngOnInit(): void {
    const totalAmount = this.fees.reduce((sum, row) => sum + Number(row.remainingAmount || 0), 0);
    this.formGroup.patchValue({ totalAmount });
    this.syncTransactionIdControl();

    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.paymentMode,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.PaymentMode },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
    });
  }

  private handleSubmit = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.getRawValue();
    const result: PayFeesDialogResult = {
      feeStudentIds: this.fees.map((row) => String(row.feeStudentId)),
      totalAmount: Number(formValue.totalAmount ?? 0),
      paymentMode: Number(formValue.paymentMode ?? 0),
      transactionId: formValue.transactionId?.trim() || null,
      remarks: formValue.remarks?.trim() || null,
    };

    this.onSave.emit(result);
  };

  private setFormControls = (): void => {
    this.formControls.set({
      formSection: [
        {
          controls: [
            {
              control: {
                ...getTextboxConfig(SYSTEM_CONST.LABELS.FEE.TOTAL_AMOUNT, 'totalAmount', undefined, InputType.currency, undefined, undefined, () => true),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.Number,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getDropdownConfig('paymentMode', SYSTEM_CONST.LABELS.FEE.PAYMENT_MODE, this.paymentModeOptions, null, null, this.syncTransactionIdControl),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getTextboxConfig(SYSTEM_CONST.LABELS.FEE.TRANSACTION_ID, 'transactionId', undefined, InputType.text, undefined, undefined, () => this.isCashMode()),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.Text,
              class: 'col-12',
              isHiddenField: () => !this.formGroup.controls.paymentMode.value || this.isCashMode(),
            },
            {
              control: {
                ...getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.REMARKS, 'remarks', undefined, InputType.textarea),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.TextArea,
              class: 'col-12',
            },
          ],
        },
      ],
    });
  };

  private syncTransactionIdControl = (): void => {
    const control = this.formGroup.controls.transactionId;
    control.clearValidators();
    control.addValidators([Validators.maxLength(100)]);

    if (this.isCashMode()) {
      control.setValue(null, { emitEvent: false });
      control.disable({ emitEvent: false });
    } else {
      control.enable({ emitEvent: false });
      control.addValidators([Validators.required]);
    }
    control.updateValueAndValidity({ emitEvent: false });
  };

  private isCashMode = (): boolean => {
    return Number(this.formGroup.controls.paymentMode.value) === PaymentMode.Cash;
  };
}

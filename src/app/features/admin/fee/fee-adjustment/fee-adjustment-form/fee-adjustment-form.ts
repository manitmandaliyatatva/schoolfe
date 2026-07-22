import { Component, effect, inject, OnInit, signal, OnDestroy } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators, ValidatorFn } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ButtonComponent } from "../../../../../shared/components/button/button.component";
import { DynamicFormComponent } from "../../../../../shared/components/dynamic-form/dynamic-form.component";
import { DynamicForm } from "../../../../../shared/components/dynamic-form/model/dynamic-form.model";
import { BaseFormComponent } from "../../../../../shared/components/form-base/form-base";
import { CurrencyFormatPipe } from "../../../../../shared/pipes/currency-format.pipe";
import { API } from "../../../../../shared/constants/api-url";
import { FeeAdjustmentType } from "../../../../../shared/constants/fee-adjustment-type.constant";
import { LookupMnemonics } from "../../../../../shared/constants/lookup-type-ids.constant";
import { ITextValueOption } from "../../../../../shared/models/common.model";
import { TITLES } from "../../../../../shared/constants/title.constant";
import { InputType } from "../../../../../shared/Enums/common.enum";
import { getTextboxConfig, getDropdownConfig } from "../../../../../shared/functions/config-function";
import { DynamicFormControlType } from "../../../../../shared/models/form-control-base.model";
import { FeeAdjustment, feeAdjustmentStore, FeeAdjustmentDialogData, FeeAdjustmentConst, UnpaidStudentFeeDropdown } from "../model/fee-adjustment.model";
import { isFeeStatusPaid } from "../../../../../shared/constants/fee-status-type.constant";
import { SYSTEM_CONST } from "../../../../../core/constants/system.constant";
import { CommonDropdownStore } from "../../../../../core/store/common-dropdown.store";
import CommonHelper from "../../../../../core/helpers/common-helper";
import { UntilDestroy } from "@ngneat/until-destroy";
import { DropdownOption } from "../../../../../shared/models/Dropdown.model";
import { EMPTY_GUID } from "../../../../../shared/constants/app.constants";

@UntilDestroy()
@Component({
  selector: 'app-fee-adjustment-form',
  standalone: true,
  imports: [DynamicFormComponent, ReactiveFormsModule, ButtonComponent],
  providers: [CurrencyFormatPipe],
  templateUrl: './fee-adjustment-form.html',
  styleUrl: './fee-adjustment-form.scss',
})
export class FeeAdjustmentForm extends BaseFormComponent<FeeAdjustment> implements OnInit, OnDestroy {
  protected readonly FeeAdjustmentConst = FeeAdjustmentConst;

  override formControls: DynamicForm;
  override store = inject(feeAdjustmentStore);
  protected override getByIdEndpoint: string = API.ADMIN.FEE.FEE_ADJUSTMENT.GET;
  protected override entityIdParamKey: string = 'feeAdjustmentId';

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<any, boolean>, { optional: true });
  private readonly dialogData = inject<FeeAdjustmentDialogData>(MAT_DIALOG_DATA, { optional: true });
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly currencyPipe = inject(CurrencyFormatPipe);

  private readonly DROPDOWN_KEYS = {
    student: 'studentDropdown',
    studentFee: 'studentFeeDropdown',
    adjustmentType: 'feeAdjustmentType',
  } as const;

  readonly studentDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.student);
  readonly studentFeeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.studentFee);
  readonly adjustmentTypeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.adjustmentType);
  adjustmentTypeOptions: ITextValueOption[] = [];

  readonly studentName = signal('');
  readonly isAlreadyPaid = signal(false);

  private selectedRemainingAmount: number | undefined;
  private maxValidatorRef: ValidatorFn | null = null;

  constructor() {
    super();

    this.bindDropdownToControl('adjustmentType', this.adjustmentTypeDropdownList, (options) => {
      this.adjustmentTypeOptions = options;
    });

    effect(() => {
      this.buildFormControls();
    });

    effect(() => {
      if (this.isSaveClicked() && this.store.isSuccess()) {
        this.getData().onSave?.(this.formGroup.getRawValue() as FeeAdjustment);
      }
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.adjustmentType,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.FeeAdjustmentType },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
    });

    const data = this.getData();
    if (data.feeStatus && isFeeStatusPaid(data.feeStatus)) {
      this.isAlreadyPaid.set(true);
      this.formGroup.disable();
      this.saveBtn.set({ ...this.saveBtn(), visibleCallback: () => false });
    }

    if (this.isEditMode()) {
      this.formGroup.controls.adjustmentType.disable();
    }

    if (data.feeStudentId || this.isEditMode()) {
      this.formGroup.controls.studentId.clearValidators();
      this.formGroup.controls.studentId.updateValueAndValidity();
    }

    if (data.feeStudentId) {
      this.formGroup.patchValue({
        feeStudentId: data.feeStudentId,
        studentNameDisplay: data.studentName,
        feeTypeName: data.feeTypeName || ''
      });

      if (data.remainingAmount) {
        this.selectedRemainingAmount = data.remainingAmount;
        this.updateAmountValidator();
      }
    } else {
      this.loadStudentDropdown();
    }
  }

  protected override resolveEditId(): string | null {
    const dialogId = this.dialogData?.feeAdjustmentId;
    if (dialogId) return dialogId;
    return super.resolveEditId();
  }

  private loadStudentDropdown(): void {
    this.dropdownStore.getDropdown<DropdownOption>({
      key: this.DROPDOWN_KEYS.student,
      endpoint: API.ADMIN.USER.STUDENT.GETSTUDENTLISTDROPDOWN,
    });
  }

  private updateAmountValidator(): void {
    const amountControl = this.formGroup.controls.amount;
    const adjustmentType = this.formGroup.controls.adjustmentType.value;

    if (this.maxValidatorRef) {
      amountControl.removeValidators(this.maxValidatorRef);
      this.maxValidatorRef = null;
    }

    if (
      this.selectedRemainingAmount &&
      this.selectedRemainingAmount > 0 &&
      adjustmentType !== FeeAdjustmentType["Extra Charge"]
    ) {
      this.maxValidatorRef = this.customMaxValidator(this.selectedRemainingAmount);
      amountControl.addValidators(this.maxValidatorRef);
    }

    amountControl.updateValueAndValidity();
  }

  private customMaxValidator(maxAmount: number): ValidatorFn {
    return (control) => {
      const val = Number(control.value);
      if (control.value !== null && control.value !== '' && !isNaN(val) && val > maxAmount) {
        return { customMaxError: FeeAdjustmentConst.EXCEED_AMOUNT_ERROR(this.currencyPipe.transform(maxAmount)) };
      }
      return null;
    };
  }

  private loadStudentFeeDropdown(studentId: string): void {
    this.dropdownStore.getDropdown<UnpaidStudentFeeDropdown>({
      key: this.DROPDOWN_KEYS.studentFee,
      endpoint: API.ADMIN.FEE.STUDENT_FEE.UNPAID_DROPDOWN,
      params: { studentId },
      force: true
    });
  }

  private getData(): FeeAdjustmentDialogData {
    return this.dialogData ?? { feeStudentId: '', studentName: '' };
  }

  public override formGroup = this.fb.nonNullable.group({
    feeAdjustmentId: this.fb.control<string | null>(EMPTY_GUID),
    studentId: this.fb.control<string | null>(null, Validators.required),
    feeStudentId: this.fb.control<string | null>(null, Validators.required),
    studentNameDisplay: this.fb.control({ value: '', disabled: true }),
    feeTypeName: this.fb.control({ value: '', disabled: true }),
    adjustmentTypeName: this.fb.control<string | null>(null),
    adjustmentType: this.fb.control<number | null>(null, Validators.required),
    amount: this.fb.control<number | null>(null, Validators.required),
    remarks: this.fb.control<string | null>(null),
    isActive: this.fb.control<boolean>(true),
  });

  protected override buildFormControls = (): void => {
    const isGlobalAdd = !this.getData().feeStudentId;
    this.formControls = {
      formSection: [
        {
          controls: [
            ...(isGlobalAdd ? [
              {
                control: getDropdownConfig('studentId', SYSTEM_CONST.LABELS.USER.STUDENT, this.studentDropdownList(), {}, null, (data: DropdownOption) => {
                  if (data.value) {
                    this.loadStudentFeeDropdown(data.value as string);
                  } else {
                    this.dropdownStore.resetKey(this.DROPDOWN_KEYS.studentFee);
                    this.formGroup.controls.feeStudentId.setValue(null);
                  }
                }),
                type: DynamicFormControlType.DropDown,
                class: 'col-md-6 col-12',
              },
              {
                control: getDropdownConfig('feeStudentId', SYSTEM_CONST.LABELS.FEE.STUDENT_FEE, this.studentFeeDropdownList(), undefined, undefined, (data: UnpaidStudentFeeDropdown) => {
                  this.selectedRemainingAmount = data?.remainingAmount;
                  this.updateAmountValidator();
                }),
                type: DynamicFormControlType.DropDown,
                class: 'col-md-6 col-12',
              }
            ] : [
              {
                control: getTextboxConfig(FeeAdjustmentConst.STUDENT_NAME, 'studentNameDisplay'),
                type: DynamicFormControlType.Text,
                class: 'col-md-6 col-12',
              },
              {
                control: getTextboxConfig(FeeAdjustmentConst.STUDENT_FEE_TITLE, 'feeTypeName'),
                type: DynamicFormControlType.Text,
                class: 'col-md-6 col-12',
              }
            ]),
            {
              control: {
                ...getDropdownConfig('adjustmentType', SYSTEM_CONST.LABELS.FEE.ADJUSTMENT_TYPE, this.adjustmentTypeOptions, undefined, undefined, () => {
                  this.updateAmountValidator();
                }),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-md-6 col-12',
            },
            {
              control: getTextboxConfig(
                SYSTEM_CONST.LABELS.COMMON.AMOUNT,
                'amount',
                undefined,
                InputType.currency
              ),
              type: DynamicFormControlType.Text,
              class: 'col-md-6 col-12',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.REMARKS, 'remarks', undefined, InputType.text),
              type: DynamicFormControlType.Text,
              class: 'col-12',
            },
          ],
        },
      ]
    }
  }

  protected override patchForm = (config: FeeAdjustment): void => {
    this.formGroup.patchValue({
      ...config,
      feeAdjustmentId: CommonHelper.resolveId(config.feeAdjustmentId),
      feeStudentId: CommonHelper.resolveId(config.feeStudentId)
    });
    this.studentName.set(config.studentName || '');
    this.selectedRemainingAmount = config.remainingAmount;
    this.updateAmountValidator();
    this.buildFormControls();
  }

  protected override submitForm(): void {
    const { studentId, studentNameDisplay, feeTypeName, ...payload } = this.formGroup.getRawValue();

    this.store.create({
      endpoint: API.ADMIN.FEE.FEE_ADJUSTMENT.ADDUPDATE,
      body: { ...payload } as FeeAdjustment
    });
  }

  protected override cancelRoute = (): string[] => {
    return ['admin', 'fee', 'fee-adjustments']
  }

  override onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close(this.store.isSuccess());
    } else {
      super.onCancel();
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dropdownStore.resetState();
  }
}



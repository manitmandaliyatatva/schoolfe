import { Component, inject, OnDestroy } from '@angular/core';
import { BaseFormComponent } from '../../../../../../shared/components/form-base/form-base';
import { lateFeeStore, ILateFeeConfig, LateFeeConst } from '../../model/late-fee.model';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY_GUID } from '../../../../../../shared/constants/app.constants';
import { DynamicForm } from '../../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { TITLES } from '../../../../../../shared/constants/title.constant';
import { API } from '../../../../../../shared/constants/api-url';
import { getDropdownConfig, getSlideToggleConfig, getTextboxConfig } from '../../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../../shared/models/form-control-base.model';
import { InputType } from '../../../../../../shared/Enums/common.enum';
import { DynamicFormComponent } from '../../../../../../shared/components/dynamic-form/dynamic-form.component';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { CommonDropdownStore } from '../../../../../../core/store/common-dropdown.store';
import { ITextValueOption } from '../../../../../../shared/models/common.model';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { FormUtils } from '../../../../../../core/helpers/form-utils';
import CommonHelper from '../../../../../../core/helpers/common-helper';

@Component({
  selector: 'app-late-fee-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, ButtonComponent],
  templateUrl: './late-fee-form.html',
})
export class LateFeeForm extends BaseFormComponent<ILateFeeConfig> implements OnDestroy {

  private readonly DROPDOWN_KEYS = {
    feeTypeId: 'feeTypeList'
  } as const;

  private feeTypeOptions: ITextValueOption[] = [];

  override formControls: DynamicForm;
  override store = inject(lateFeeStore);
  protected override getByIdEndpoint: string = API.ADMIN.FEE.LATE_FEE.GET;
  protected override entityIdParamKey: string = 'lateFeeConfigId';

  private readonly fb = inject(FormBuilder);
  readonly dropdownStore = inject(CommonDropdownStore);
  readonly feeTypeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.feeTypeId);

  constructor() {
    super();
    this.bindDropdownToControl('feeTypeId', this.feeTypeDropdownList, (options) => {
      this.feeTypeOptions = options;
    });
  }

  protected override loadData = (): void => {
    super.loadData();
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.feeTypeId,
      endpoint: API.ADMIN.FEE.FEE_TYPE.DROPDOWN,
    });
  }

  public override formGroup = this.fb.nonNullable.group({
    lateFeeConfigId: this.fb.control<string | null>(EMPTY_GUID),
    feeTypeId: this.fb.control<string | null>(null, Validators.required),
    feeTypeName: this.fb.control<string | null>(null),
    daysFrom: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
      FormUtils.compareValueValidator('daysTo', true, LateFeeConst.DAYS_FROM, LateFeeConst.DAYS_TO)
    ]),
    daysTo: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
      FormUtils.compareValueValidator('daysFrom', false, LateFeeConst.DAYS_TO, LateFeeConst.DAYS_FROM)
    ]),
    lateFeeAmount: this.fb.control<number | null>(null, Validators.required),
    isPercentage: this.fb.control<boolean | null>(false),
    isActive: this.fb.control<boolean>(true),
  });

  protected override buildFormControls = (): void => {
    this.formControls = {
      formSection: [
        {
          controls: [
            {
              control: {
                ...getDropdownConfig('feeTypeId', SYSTEM_CONST.LABELS.FEE.FEE_TYPE, this.feeTypeOptions),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getTextboxConfig(LateFeeConst.DAYS_FROM, 'daysFrom', undefined, InputType.number),
                allowFloatValues: false
              },
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getTextboxConfig(LateFeeConst.DAYS_TO, 'daysTo', undefined, InputType.number),
                allowFloatValues: false
              },
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(
                LateFeeConst.LATE_FEE_AMOUNT,
                'lateFeeAmount',
                undefined,
                this.formGroup.controls.isPercentage.value ? InputType.percentage : InputType.currency
              ),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getSlideToggleConfig('isPercentage', LateFeeConst.IS_PERCENTAGE, 'after', null, () => {
                this.buildFormControls();
              }),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-4',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE, 'after'),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-4',
            },
          ],
          title: LateFeeConst.LATE_FEE_CONFIGURATION
        },
      ]
    }
  }

  protected override patchForm = (config: ILateFeeConfig): void => {
    this.formGroup.patchValue({
      ...config,
      lateFeeConfigId: CommonHelper.resolveId(config.lateFeeConfigId),
      feeTypeId: CommonHelper.resolveId(config.feeTypeId)
    });
    this.buildFormControls();
  }

  protected override submitForm = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.isSaveClicked.set(true);
    this.store.create({
      endpoint: API.ADMIN.FEE.LATE_FEE.ADDUPDATE,
      body: this.formGroup.getRawValue() as ILateFeeConfig
    });
  }

  protected override cancelRoute = (): string[] => {
    return ['admin', 'fee', 'late-fees']
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dropdownStore.resetState();
  }
}

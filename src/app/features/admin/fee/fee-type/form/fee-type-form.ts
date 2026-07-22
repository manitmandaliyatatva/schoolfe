import { Component, inject, OnInit } from '@angular/core';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { feeTypeStore, IFeeType } from '../model/fee-type.model';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { API } from '../../../../../shared/constants/api-url';
import { getSlideToggleConfig, getTextboxConfig, getDropdownConfig } from '../../../../../shared/functions/config-function';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { FormUtils } from '../../../../../core/helpers/form-utils';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { LookupMnemonics } from '../../../../../shared/constants/lookup-type-ids.constant';
import { ITextValueOption } from '../../../../../shared/models/common.model';

@Component({
  selector: 'app-fee-type-form',
  imports: [ReactiveFormsModule, ButtonComponent, DynamicFormComponent],
  templateUrl: './fee-type-form.html',
})
export class FeeTypeForm extends BaseFormComponent<IFeeType> implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly dropdownStore = inject(CommonDropdownStore);

  private readonly DROPDOWN_KEYS = {
    frequency: 'feeTypeFrequency',
  } as const;

  readonly frequencyDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.frequency);
  frequencyOptions: ITextValueOption[] = [];

  protected override getByIdEndpoint: string = API.ADMIN.FEE.FEE_TYPE.GET;
  protected override entityIdParamKey: string = 'feeTypeId';

  override formControls: DynamicForm;
  override store: any = inject(feeTypeStore);

  public override formGroup = this.fb.nonNullable.group({
    feeTypeId: this.fb.control<string | null>(EMPTY_GUID),
    name: this.fb.control<string | null>(null, [Validators.required, FormUtils.onlyString]),
    code: this.fb.control<string | null>(null, [Validators.required, FormUtils.feeTypeCode]),
    frequency: this.fb.control<number | null>(null, Validators.required),
    isActive: this.fb.control(true),
  });

  constructor() {
    super();
    this.store.resetState();
    this.bindDropdownToControl('frequency', this.frequencyDropdownList, (options) => {
      this.frequencyOptions = options;
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.frequency,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.FeeTypeFrequency },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
    });
  }

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          controls: [
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.NAME, 'name', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.CODE, 'code', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getDropdownConfig('frequency', SYSTEM_CONST.LABELS.COMMON.FREQUENCY, this.frequencyOptions, { allowClear: true }),
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE, 'after'),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-6',
            },
          ],
          title: SYSTEM_CONST.SECTIONS.FEE_TYPE
        },
      ]
    }
  }

  protected override patchForm(feeType: IFeeType): void {
    this.formGroup.patchValue(feeType);
  }

  protected override submitForm(): void {
    this.store.create({
      endpoint: API.ADMIN.FEE.FEE_TYPE.ADDUPDATE,
      body: { ...this.formGroup.getRawValue() } as IFeeType,
    });
  }
  protected override cancelRoute(): string[] {
    return ['admin', 'fee', 'fee-types'];
  }

}

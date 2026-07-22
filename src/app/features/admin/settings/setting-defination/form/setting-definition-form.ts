import { Component, inject } from '@angular/core';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { SettingDefinition, settingDefinitionStore } from '../model/setting-defination.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { API } from '../../../../../shared/constants/api-url';
import { getDropdownConfig, getSlideToggleConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';

@Component({
  selector: 'app-setting-definition-form',
  imports: [DynamicFormComponent, CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './setting-definition-form.html',
  styleUrl: './setting-definition-form.scss',
})
export class SettingDefinitionForm extends BaseFormComponent<SettingDefinition> {
  private readonly fb = inject(FormBuilder);
  private readonly DROPDOWN_KEYS = {
    settingGroup: 'settingGroup',
    noticeGroupId: 'controlType',
  } as const;

  protected override formGroup: FormGroup<any> = this.fb.group({
    settingDefinitionId: [EMPTY_GUID],
    settingGroupId: ['', [Validators.required]],
    settingKey: ['', [Validators.required]],
    settingLabel: ['', [Validators.required]],
    settingValue: ['', [Validators.required]],
    controlType: ['', [Validators.required]],
    dataType: ['', [Validators.required]],
    placeholder: [''],
    isRequired: [true, [Validators.required]],
    displayOrder: [0, [Validators.required, Validators.min(0)]],
    minLength: [0],
    maxLength: [0],
    regexPattern: [''],
    dropdownOptions: [''],
  });

  private settingGroup: ITextValueOption[] = [];
  private controlTypeList: ITextValueOption[] = [];
  private datatypeList: ITextValueOption[] = [];

  private dropdownStore = inject(CommonDropdownStore);

  protected override formControls: DynamicForm;
  protected override store = inject(settingDefinitionStore);
  protected override getByIdEndpoint: string = API.ADMIN.SETTINGS.SETTING_DEFINATION.GET;
  protected override entityIdParamKey: keyof SettingDefinition = 'settingDefinitionId';

  constructor() {
    super();
    this.bindDropdownToControl(
      'settingGroupId',
      this.dropdownStore.getList(this.DROPDOWN_KEYS.settingGroup),
      (options) => (this.settingGroup = options),
      () => this.buildFormControls()
    );
    this.controlTypeList = Object.entries(DynamicFormControlType).map(([key, value]) => ({
      text: key.replace(/([A-Z])/g, ' $1').trim(),
      value: value
    }));
    this.datatypeList = Object.keys(InputType)
      .filter(key => isNaN(Number(key)))
      .map(key => ({
        text: key,
        value: key
      }));
    console.log(this.datatypeList);

  }
  override ngOnInit(): void {
    super.ngOnInit()
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.settingGroup,
      endpoint: API.ADMIN.SETTINGS.SETTING_GROUP.DROPDOWN,
    });
    this.formGroup.get('settingKey').disable();

    this.formGroup.get('settingGroupId').valueChanges.subscribe(settingGroupId => {
      if (settingGroupId && !this.isEditMode()) {
        this.store.getWithResult<number>({
          endpoint: API.ADMIN.SETTINGS.SETTING_DEFINATION.GET_LAST_DISPLAY_ORDER,
          params: { settingGroupId }
        }).subscribe(lastOrder => {
          const nextOrder = (lastOrder ?? 0) + 1;
          this.formGroup.patchValue({
            displayOrder: nextOrder
          });
        });
      }
    });
  }

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          controls: [
            {
              control: {
                ...getDropdownConfig('settingGroupId', 'Setting Group', this.settingGroup),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig('Setting Label', 'settingLabel', undefined, InputType.text, 'outline', null, null, null, null, null, null, null, null, null, (event: any) => {
                if (event && event.target) {
                  const value = event.target.value || '';
                  this.formGroup.patchValue({
                    settingKey: this.convertToSettingKey(value)
                  });
                }
              }),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig('Setting Key', 'settingKey', undefined, InputType.text, 'outline', null, () => true),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig('Setting Default Value', 'settingValue', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDropdownConfig('controlType', 'Control Type', this.controlTypeList),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDropdownConfig('dataType', 'Data Type', this.datatypeList),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: getSlideToggleConfig('isRequired', 'Required Setting?', 'before', 'primary'),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig('Display Order', 'displayOrder', undefined, InputType.number, 'outline'),
              type: DynamicFormControlType.Number,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig('Mimimum Length', 'minLength', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig('Maximum Length', 'maxLength', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig('Regex Pattern', 'regexPattern', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
          ]
        }
      ]
    }
  }
  convertToSettingKey(value: string): string {
    return value
      .trim()
      .replace(/[^a-zA-Z0-9 ]/g, '') // remove special characters
      .split(' ')
      .map((word, index) =>
        index === 0
          ? word.charAt(0).toLowerCase() + word.slice(1)
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join('');
  }
  protected override patchForm(data: SettingDefinition): void {
    this.formGroup.patchValue({
      settingDefinitionId: data.settingDefinitionId,
      controlType: data.controlType,
      dataType: data.dataType,
      settingGroupId: data.settingGroupId,
      settingKey: data.settingKey,
      settingLabel: data.settingLabel,
      settingValue: data.settingValue,
      placeholder: data.placeholder,
      isRequired: data.isRequired,
      displayOrder: data.displayOrder,
      minLength: data.minLength,
      maxLength: data.maxLength,
      regexPattern: data.regexPattern,
      dropdownOptions: data.dropdownOptions,
    });
  }

  protected override submitForm(): void {
    const payload = {
      ...this.formGroup.getRawValue()
    };

    this.store.create({
      endpoint: API.ADMIN.SETTINGS.SETTING_DEFINATION.ADDUPDATE,
      body: payload as any,
    });
  }
  protected override cancelRoute(): string[] {
    return ['admin/setting/setting-definition'];
  }


}

import { Component, inject, OnInit } from '@angular/core';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { SettingGroup, settingGroupStore } from '../model/setting-group.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { API } from '../../../../../shared/constants/api-url';
import { getTextboxConfig, getSlideToggleConfig } from '../../../../../shared/functions/config-function';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-setting-group-form',
  imports: [ButtonComponent, DynamicFormComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './setting-group-form.html',
  styleUrl: './setting-group-form.scss',
})
export class SettingGroupForm extends BaseFormComponent<SettingGroup> implements OnInit {
  private readonly fb = inject(FormBuilder);

  protected override formGroup: FormGroup<any> = this.fb.group({
    settingGroupId: [EMPTY_GUID],
    groupCode: ['', [Validators.required]],
    groupName: ['', [Validators.required]],
    isPublicSetting: [false]
  });
  protected override formControls: DynamicForm;
  protected override store = inject(settingGroupStore);
  protected override getByIdEndpoint: string = API.ADMIN.SETTINGS.SETTING_GROUP.GETBYID;
  protected override entityIdParamKey: keyof SettingGroup = 'settingGroupId';

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          title: '',
          controls: [
            {
              control: getTextboxConfig('Group Code', 'groupCode', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-4',
            },
            {
              control: getTextboxConfig('Group Name', 'groupName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-4',
            },
            {
              control: getSlideToggleConfig('isPublicSetting', 'Is Public Setting'),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-4',
            },
          ]
        }
      ]
    }
  }
  protected override patchForm(data: SettingGroup): void {
    this.formGroup.patchValue({
      settingGroupId: data.settingGroupId,
      groupCode: data.groupCode,
      groupName: data.groupName,
      isPublicSetting: data.isPublicSetting,
    });
  }
  protected override submitForm(): void {
    const payload = {
      ...this.formGroup.getRawValue()
    };

    this.store.create({
      endpoint: API.ADMIN.SETTINGS.SETTING_GROUP.ADDUPDATE,
      body: payload as any,
    });
  }
  protected override cancelRoute(): string[] {
    return ['admin/setting/setting-group'];
  }

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.isEditMode()) {
      this.formGroup.get('groupCode').disable();
    }
  }
}

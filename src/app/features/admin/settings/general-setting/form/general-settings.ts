import { Component, computed, inject, OnInit, effect, untracked, signal } from '@angular/core';
import { SettingGroup, settingGroupStore } from '../../setting-group/model/setting-group.model';
import { settingDefinitionStore } from '../../setting-defination/model/setting-defination.model';
import { API } from '../../../../../shared/constants/api-url';
import { buildGridListRequest } from '../../../../../shared/helpers/grid.helper';
import { MatTabsModule } from '@angular/material/tabs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrHelperService } from '../../../../../core/services/toster-helper.service';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicForm, DynamicFormControl } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getColorPickerConfig, getSlideToggleConfig, getTextboxConfig, getButtonConfig } from '../../../../../shared/functions/config-function';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { PublicSettingStore } from '../../../../../core/store/public-setting.store';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';

@Component({
  selector: 'app-general-settings',
  imports: [MatTabsModule, CommonModule, ReactiveFormsModule, DynamicFormComponent, ButtonComponent],
  templateUrl: './general-settings.html',
  styleUrl: './general-settings.scss',
})
export class GeneralSettings implements OnInit {
  private readonly store = inject(settingGroupStore);
  private readonly settingDefStore = inject(settingDefinitionStore);
  private readonly publicSetting = inject(PublicSettingStore);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrHelperService);
  private readonly router = inject(Router);
  protected readonly commonHelperService = inject(CommonHelperService);

  protected readonly permission = computed(() =>
    this.commonHelperService.getPermissionByPage()
  );
  protected readonly settingList = computed<SettingGroup[]>(() => {
    return this.store.isSuccess ? this.store.list() : null;
  });

  formGroup: FormGroup = this.fb.group({});
  tabFormControls: { [key: string]: DynamicForm } = {};

  protected readonly saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(
      () => this.onSave(),
      'flat',
      'primary',
      'Save Settings',
      true
    ),
    cssClasses: ['btn', 'primary-btn'],
  });

  protected readonly cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(
      () => this.onCancel(),
      'stroked',
      'basic',
      'Cancel',
      false
    ),
    cssClasses: ['btn', 'secondary-btn'],
  });

  constructor() {
    effect(() => {
      const p = this.permission();
      if (!p.canCreate && !p.canUpdate) this.onCancel();
    });
    effect(() => {
      const list = this.settingList();
      if (list && list.length > 0) {
        untracked(() => {
          this.buildForm(list);
        });
      }
    });

    effect(() => {
      if (this.settingDefStore.isSuccess()) {
        untracked(() => {
          this.settingDefStore.resetState();
          this.publicSetting.loadSettings();
          this.store.getAll({
            endpoint: API.ADMIN.SETTINGS.SETTING_GROUP.LIST,
            body: buildGridListRequest(null),
          });
        });
      }
    });

    effect(() => {
      const err = this.settingDefStore.error();
      if (err) {
        untracked(() => {
          this.toastr.showErrorMessage(err);
          this.settingDefStore.clearError();
        });
      }
    });
  }

  ngOnInit(): void {
    this.store.getAll({
      endpoint: API.ADMIN.SETTINGS.SETTING_GROUP.LIST,
      body: buildGridListRequest(null),
    });
  }

  buildForm(groups: SettingGroup[]): void {
    const isFirstLoad = Object.keys(this.formGroup.controls).length === 0;

    groups.forEach(group => {
      const controls: DynamicFormControl[] = [];

      const sortedDefs = [...group.settingDefinitions].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      sortedDefs.forEach(def => {
        let initialValue: any = def.settingValue;
        if (def.controlType === 'slidetoggle') {
          initialValue = (def.settingValue === '1' || def.settingValue === 'true');
        } else if (def.controlType === 'number') {
          initialValue = def.settingValue ? Number(def.settingValue) : 0;
        }

        const validators = def.isRequired ? [Validators.required] : [];

        if (isFirstLoad) {
          this.formGroup.addControl(def.settingKey, this.fb.control(initialValue, validators));

          // Build DynamicFormControl
          let controlConfig: any;
          let controlType: DynamicFormControlType;

          switch (def.controlType) {
            case 'colorpicker':
              controlConfig = getColorPickerConfig(def.settingLabel, def.settingKey);
              controlType = DynamicFormControlType.ColorPicker;
              break;
            case 'slidetoggle':
              controlConfig = getSlideToggleConfig(def.settingKey, def.settingLabel);
              controlType = DynamicFormControlType.SlideToggle;
              break;
            case 'number':
              controlConfig = getTextboxConfig(def.settingLabel, def.settingKey, undefined, InputType.number);
              controlType = DynamicFormControlType.Number;
              break;
            case 'password':
              controlConfig = getTextboxConfig(def.settingLabel, def.settingKey, undefined, InputType.password);
              controlType = DynamicFormControlType.Password;
              break;
            case 'imageupload':
              controlConfig = {
                formControlName: def.settingKey,
                label: def.settingLabel,
                altText: def.settingLabel,
                fileType: 'image',
                allowedExtensions: ['.jpeg', '.jpg', '.png']
              };
              controlType = DynamicFormControlType.ImageUpload;
              break;
            case 'documentupload':
              controlConfig = {
                formControlName: def.settingKey,
                label: def.settingLabel,
                altText: def.settingLabel,
                fileType: '',
              };
              controlType = DynamicFormControlType.DocumentUpload;
              break;
            case 'text':
            default:
              controlConfig = getTextboxConfig(def.settingLabel, def.settingKey, undefined, InputType.text);
              controlType = DynamicFormControlType.Text;
              break;
          }

          controls.push({
            control: controlConfig,
            type: controlType,
            isRequired: !!def.isRequired,
            class: 'col-12 col-md-4'
          });
        } else {
          const control = this.formGroup.get(def.settingKey);
          if (control) {
            control.setValue(initialValue, { emitEvent: false });
            control.markAsPristine();
            control.markAsUntouched();
          } else {
            this.formGroup.addControl(def.settingKey, this.fb.control(initialValue, validators));
          }
        }
      });

      if (isFirstLoad) {
        this.tabFormControls[group.groupCode] = {
          formSection: [
            {
              controls: controls
            }
          ]
        };
      }
    });
  }

  onSave(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const groups = this.settingList();
    if (!groups) return;

    const payload: any[] = [];

    groups.forEach(group =>
      group.settingDefinitions.forEach(def => {
        const currentValue = this.formGroup.get(def.settingKey)?.value;

        // Calculate the initial value using the same logic as buildForm
        let initialValue: any = def.settingValue;
        if (def.controlType === 'slidetoggle') {
          initialValue = (def.settingValue === '1' || def.settingValue === 'true');
        } else if (def.controlType === 'number') {
          initialValue = def.settingValue ? Number(def.settingValue) : 0;
        }

        // Compare based on control type to avoid type conversion mismatches
        let isChanged = false;
        if (def.controlType === 'slidetoggle' || def.controlType === 'number') {
          isChanged = currentValue !== initialValue;
        } else {
          isChanged = (currentValue ?? '') !== (initialValue ?? '');
        }

        if (isChanged) {
          // Format current value back to string for backend persistence
          let val = currentValue;
          if (val === true) {
            val = '1';
          } else if (val === false) {
            val = '0';
          } else if (val !== null && val !== undefined) {
            val = val.toString();
          } else {
            val = '';
          }

          payload.push({
            settingDefinitionId: def.settingDefinitionId,
            settingGroupId: def.settingGroupId,
            settingKey: def.settingKey,
            settingLabel: def.settingLabel,
            controlType: def.controlType,
            dataType: def.dataType,
            settingValue: val,
            placeholder: def.placeholder,
            isRequired: def.isRequired,
            minLength: def.minLength,
            maxLength: def.maxLength,
            regexPattern: def.regexPattern,
            dropdownOptions: def.dropdownOptions
          });
        }
      })
    );

    if (payload.length === 0) {
      this.toastr.showWarningMessage('No changes detected.');
      return;
    } else {
      this.settingDefStore.create({
        endpoint: API.ADMIN.SETTINGS.SETTING_DEFINATION.UPDATE_VALUES,
        body: payload as any
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}

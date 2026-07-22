import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { API } from '../../../../../shared/constants/api-url';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getSlideToggleConfig, getTextboxConfig, getColorPickerConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { EVENT_TYPE_CONST, EventType, eventTypeStore } from '../models/event-types.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';

@Component({
  selector: 'app-event-types-form',
  imports: [ReactiveFormsModule, ButtonComponent, DynamicFormComponent],
  templateUrl: './event-types-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventTypesForm extends BaseFormComponent<EventType> implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cd = inject(ChangeDetectorRef);

  protected override formGroup = this.fb.nonNullable.group({
    eventTypeId: this.fb.control<string | null>(EMPTY_GUID),
    eventTypeName: this.fb.control('', Validators.required),
    colorCode: this.fb.control('#000000'),
    isActive: this.fb.control(true),
  });

  protected override formControls!: DynamicForm;
  protected override store = inject(eventTypeStore);
  protected override getByIdEndpoint: string = API.ADMIN.CALENDAR.EVENT_TYPES.GET;
  protected override entityIdParamKey: keyof EventType = 'eventTypeId';

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(EVENT_TYPE_CONST.EVENT_TYPE_NAME, 'eventTypeName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getColorPickerConfig(EVENT_TYPE_CONST.COLOR_CODE, 'colorCode'),
              type: DynamicFormControlType.ColorPicker,
              class: 'col-12 col-md-6',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-6',
            },
          ],
        },
      ],
    };
  }

  protected override patchForm(data: EventType): void {
    this.formGroup.patchValue(data);
    this.cd.markForCheck();
  }

  protected override submitForm(): void {
    this.store.create({
      endpoint: API.ADMIN.CALENDAR.EVENT_TYPES.ADDUPDATE,
      body: { ...this.formGroup.getRawValue() },
    });
  }

  protected override cancelRoute(): string[] {
    return ['admin', 'calendar', 'event-types'];
  }

}


import { Component, inject } from '@angular/core';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { ATTENDENCE_STATUS, attendenceStatusStore, IAttendenceStatus } from '../models/attendence-status';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { API } from '../../../../../shared/constants/api-url';
import { getSlideToggleConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import CommonHelper from '../../../../../core/helpers/common-helper';

@Component({
  selector: 'app-attendence-status-form',
  imports: [ReactiveFormsModule, ButtonComponent, DynamicFormComponent],
  templateUrl: './attendence-status-form.html'
})
export class AttendenceStatusForm extends BaseFormComponent<IAttendenceStatus> {
  private readonly fb = inject(FormBuilder);

  protected override formGroup: FormGroup<any> = this.fb.nonNullable.group({
    attendanceStatusId: this.fb.control<string | null>(EMPTY_GUID),
    attendanceStatusName: this.fb.control<string | null>(null, Validators.required),
    attendanceStatusCode: this.fb.control<string | null>(null, Validators.required),
    isActive: this.fb.control(true),
  });

  protected override formControls: DynamicForm;
  protected override store = inject(attendenceStatusStore);
  protected override getByIdEndpoint: string = API.ADMIN.CONFIGURATION.ATTENDENCE_STATUS.GET;
  protected override entityIdParamKey: string = 'attendanceStatusId';

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          controls: [
            {
              control: getTextboxConfig(ATTENDENCE_STATUS.NAME, 'attendanceStatusName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(ATTENDENCE_STATUS.CODE, 'attendanceStatusCode', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE, 'after'),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-6',
            },
          ],
          title: TITLES.ADMIN.ATTENDENCE_STATUS
        },
      ]
    }
  }
  protected override patchForm(data: IAttendenceStatus): void {
    this.formGroup.patchValue({
      ...data,
      attendanceStatusId: CommonHelper.resolveId(data.attendanceStatusId),
    });
  }
  protected override submitForm(): void {
    this.store.create({
      endpoint: API.ADMIN.CONFIGURATION.ATTENDENCE_STATUS.ADDUPDATE,
      body: { ...this.formGroup.getRawValue() } as any
    })
  }
  protected override cancelRoute(): string[] {
    return ['admin', 'configuration', 'attendance-statuses']
  }

}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { API } from '../../../../../shared/constants/api-url';
import { ADMIN_ROUTE } from '../../../../../shared/constants/route.constant';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { InputType } from '../../../../../shared/Enums/common.enum';
import {
  getSlideToggleConfig,
  getTextboxConfig,
} from '../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { EXAM_TYPE_CONST, ExamType, examTypeStore } from '../models/examtype.model';
import { AuthStore } from '../../../../../core/store/auth.store';

@Component({
  selector: 'app-examtype-form',
  imports: [ReactiveFormsModule, DynamicFormComponent, ButtonComponent],
  templateUrl: './examtype-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamTypeForm extends BaseFormComponent<ExamType> {
  private readonly fb = inject(FormBuilder);
  protected override readonly store = inject(examTypeStore);
  public readonly consts = EXAM_TYPE_CONST;
  private readonly authStore = inject(AuthStore);
  protected override readonly getByIdEndpoint = API.ADMIN.EXAMINATION.EXAM_TYPE.GET;
  protected override readonly entityIdParamKey = 'examTypeId';

  protected override formGroup = this.fb.group({
    examTypeId: [EMPTY_GUID],
    examTypeName: ['', [Validators.required]],
    examTypeCode: ['', [Validators.required]],
    allowAdmin: [false],
    allowTeacher: [false],
    isActive: [true],
  });
  protected override formControls!: DynamicForm;

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          controls: [
            {
              control: getTextboxConfig(
                this.consts.EXAM_TYPE_NAME,
                'examTypeName',
                undefined,
                InputType.text,
                'outline'
              ),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: getTextboxConfig(
                this.consts.EXAM_TYPE_CODE,
                'examTypeCode',
                undefined,
                InputType.text,
                'outline'
              ),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: getSlideToggleConfig(
                'allowAdmin',
                this.consts.ALLOW_ADMIN,
                'after',
                'primary'
              ),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-4',
            },
            {
              control: getSlideToggleConfig(
                'allowTeacher',
                this.consts.ALLOW_TEACHER,
                'after',
                'primary'
              ),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-4',
            },
            {
              control: getSlideToggleConfig(
                'isActive',
                SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE,
                'after',
                'primary'
              ),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-4',
            },
          ],
        },
      ],
    };
  }

  protected override patchForm(data: ExamType): void {
    this.formGroup.patchValue(data);
  }

  protected override submitForm(): void {
    this.store.create({
      endpoint: API.ADMIN.EXAMINATION.EXAM_TYPE.ADDUPDATE,
      body: { ...this.formGroup.value } as any,
    });
  }

  protected override cancelRoute(): string[] {
    return [this.authStore.roleRoutePath(), ADMIN_ROUTE.EXAMINATION.EXAMINATION, ADMIN_ROUTE.EXAMINATION.EXAM_TYPES];
  }
}

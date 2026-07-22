import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { API } from '../../../../../shared/constants/api-url';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getTextboxConfig, getSlideToggleConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { ClassStore } from '../stores/class.store';
import { ADMIN_ROUTE } from '../../../../../shared/constants/route.constant';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { CLASS_PAGE_CONST, ClassGridRow } from '../models/class.model';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { FormUtils } from '../../../../../core/helpers/form-utils';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import CommonHelper from '../../../../../core/helpers/common-helper';

@Component({
  selector: 'app-class-form',
  imports: [ReactiveFormsModule, DynamicFormComponent, ButtonComponent],
  templateUrl: './class-form.html',
  styleUrl: './class-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassForm extends BaseFormComponent<ClassGridRow> {
  private readonly fb = inject(FormBuilder);

  protected override readonly store = inject(ClassStore);
  protected override getByIdEndpoint = API.CLASS.GET_CLASS_BY_ID;
  protected override entityIdParamKey = 'id';

  protected override readonly formGroup = this.fb.group({
    classId: [EMPTY_GUID],
    className: ['', [Validators.required, FormUtils.onlyAlphanumericWithSpace]],
    classCode: ['', [Validators.required]],
    category: ['', [Validators.required, FormUtils.onlyString]],
    isActive: [true, [Validators.required]],
  });

  protected override formControls!: DynamicForm;

  constructor() {
    super();
    this.store.resetState();
  }

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(CLASS_PAGE_CONST.CLASS_NAME, 'className', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: getTextboxConfig(CLASS_PAGE_CONST.CLASS_CODE, 'classCode', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.CATEGORY, 'category', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE, 'after', 'primary'),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12',
            },
          ],
        },
      ],
    };
  }

  protected override loadData(): void {
    if (this.isEditMode()) {
      this.store.getById({
        endpoint: this.getByIdEndpoint,
        params: { classId: this.editId() },
      });
    }
  }

  protected override patchForm(data: ClassGridRow): void {
    this.formGroup.patchValue({
      classId: CommonHelper.resolveId(data.classId),
      className: data.className,
      classCode: data.classCode,
      category: data.category,
      isActive: data.isActive,
    });
  }

  protected override submitForm(): void {
    const payload = {
      ...this.formGroup.value
    };

    this.store.create({
      endpoint: API.CLASS.ADD_UPDATE_CLASS,
      body: payload as any,
    });
  }

  protected override cancelRoute(): string[] {
    return ['admin/configuration/', ADMIN_ROUTE.CONFIGURATION.CLASS];
  }
}

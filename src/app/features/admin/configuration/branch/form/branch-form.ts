import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getSlideToggleConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { branchStore, Branch, BRANCH_CONST } from '../models/branch.model';
import { API } from '../../../../../shared/constants/api-url';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { FormUtils } from '../../../../../core/helpers/form-utils';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';

@Component({
  selector: 'app-branch-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, MatButtonModule, ButtonComponent],
  providers: [branchStore],
  templateUrl: './branch-form.html',
})
export class BranchFormComponent extends BaseFormComponent<Branch> {
  private readonly fb = inject(FormBuilder);

  protected override formGroup = this.fb.nonNullable.group({
    branchId: this.fb.control(EMPTY_GUID),
    branchName: this.fb.control(null, [Validators.required]),
    branchCode: this.fb.control(null),
    address: this.fb.control(null),
    landMark: this.fb.control(null, [Validators.required]),
    city: this.fb.control(null),
    state: this.fb.control(null),
    country: this.fb.control(null),
    phone: this.fb.control(null, [FormUtils.phoneNumber]),
    email: this.fb.control(null, [Validators.email]),
    isActive: this.fb.control(true),
  });

  protected override formControls!: DynamicForm;
  protected override readonly store = inject(branchStore);
  protected override getByIdEndpoint = API.SUPER_ADMIN.BRANCH.GET;
  protected override entityIdParamKey = 'branchId';

  protected override buildFormControls = (): void => {
    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(BRANCH_CONST.BRANCH_NAME, 'branchName'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(BRANCH_CONST.BRANCH_CODE, 'branchCode'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
              isHiddenField: () => !this.isEditMode()
            },
            {
              control: getTextboxConfig(BRANCH_CONST.LANDMARK, 'landMark'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(BRANCH_CONST.PHONE, 'phone', null, InputType.contactNumber),
              type: DynamicFormControlType.ContactNumber,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(BRANCH_CONST.EMAIL, 'email', null, InputType.email),
              type: DynamicFormControlType.Email,
              class: 'col-12 col-md-4',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-4 col-xl-4',
            },
          ],
        },
        {
          title: SYSTEM_CONST.SECTIONS.ADDRESS,
          controls: [
            {
              control: getTextboxConfig(BRANCH_CONST.CITY, 'city'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(BRANCH_CONST.STATE, 'state'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(BRANCH_CONST.COUNTRY, 'country'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(BRANCH_CONST.ADDRESS, 'address'),
              type: DynamicFormControlType.TextArea,
              class: 'col-12 col-md-4',
            },
          ],
        }
      ],
    };
  }

  protected override patchForm = (branch: Branch): void => {
    this.formGroup.controls.branchCode.disable();
    this.formGroup.patchValue(branch);
  }

  protected override submitForm = (): void => {
    this.store.create({
      endpoint: API.SUPER_ADMIN.BRANCH.ADDUPDATE,
      body: this.formGroup.getRawValue() as Branch,
    });
  }

  protected override cancelRoute(): string[] {
    return ['admin', 'configuration', 'branches'];
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../../core/store/auth.store';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../shared/components/button/model/button.model';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../shared/components/dynamic-form/model/dynamic-form.model';
import { InputType } from '../../../shared/Enums/common.enum';
import { getButtonConfig, getTextboxConfig } from '../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../shared/models/form-control-base.model';
import { LOGIN_CONST } from '../auth.model';
import { REGEX_CONST } from '../../../core/constants/regex.constant';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, DynamicFormComponent],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  authStore = inject(AuthStore);
  Login_Const = LOGIN_CONST;
  tempToken: string | null = null;
  dynamicForm!: DynamicForm;
  updatePasswordButtonConfig = signal<CommonButtonConfig>({
    ...getButtonConfig(
      () => { },
      'flat',
      'primary',
      this.Login_Const.UPDATE_PASSWORD,
      true,
      () => false
    ),
    cssClasses: ['submit-btn'],
    type: 'submit'
  });

  changePasswordForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, (control: AbstractControl) => {
        if (!control.value) return null;
        return REGEX_CONST.PASSWORD.test(control.value) ? null : { passwordPattern: true };
      }]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      this.tempToken = params.get('token');
    });
    this.buildForm();
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    const updateError = (ctrl: AbstractControl | null, errorKey: string, isInvalid: boolean) => {
      if (!ctrl) return;
      const errors = { ...(ctrl.errors || {}) };
      isInvalid ? (errors[errorKey] = true) : delete errors[errorKey];
      ctrl.setErrors(Object.keys(errors).length ? errors : null);
    };

    updateError(confirmPassword, 'passwordMismatch', !!(newPassword?.value && confirmPassword?.value && newPassword.value !== confirmPassword.value));

    return null;
  }

  submit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }
    const token = this.tempToken || this.authStore.tempToken();
    if (token) {
      const { newPassword } = this.changePasswordForm.getRawValue();
      this.authStore.resetPassword({ newPassword, tempToken: token });
    }
  }

  private buildForm(): void {
    this.dynamicForm = {
      formSection: [
        {
          controls: [
            {
              control: {
                ...getTextboxConfig(this.Login_Const.NEW_PASSWORD, 'newPassword', undefined, InputType.password, 'outline'),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.Text,
              class: 'col-sm-6 col-lg-6 col-xl-12',
            },
            {
              control: {
                ...getTextboxConfig(this.Login_Const.CONFIRM_PASSWORD, 'confirmPassword', undefined, InputType.password, 'outline'),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.Text,
              class: 'col-sm-6 col-lg-6 col-xl-12',
            }
          ]
        }
      ]
    };
  }
}

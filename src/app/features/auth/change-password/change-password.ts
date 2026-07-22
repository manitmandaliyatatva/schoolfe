import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthStore } from '../../../core/store/auth.store';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../shared/components/dynamic-form/model/dynamic-form.model';
import { GenericDialog } from '../../../shared/components/generic-dialog/generic-dialog';
import { InputType } from '../../../shared/Enums/common.enum';
import { getButtonConfig, getTextboxConfig } from '../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../shared/models/form-control-base.model';
import { LOGIN_CONST } from '../auth.model';
import { CommonButtonConfig } from '../../../shared/components/button/model/button.model';
import { REGEX_CONST } from '../../../core/constants/regex.constant';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, DynamicFormComponent],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<GenericDialog, boolean>);
  private readonly authStore = inject(AuthStore);

  Login_Const = LOGIN_CONST;

  changePasswordForm = this.fb.nonNullable.group(
    {
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, (control: AbstractControl) => {
        if (!control.value) return null;
        return REGEX_CONST.PASSWORD.test(control.value) ? null : { passwordPattern: true };
      }]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  dynamicForm: DynamicForm = { formSection: [] };

  saveBtn: CommonButtonConfig = {
    ...getButtonConfig(
      () => this.submit(),
      'flat',
      'primary',
      this.Login_Const.UPDATE_PASSWORD,
      true
    ),
    disableCallBack: () => this.authStore.isLoading()
  };

  cancelBtn: CommonButtonConfig = getButtonConfig(
    () => this.onCancel(),
    'stroked',
    'basic',
    this.Login_Const.CANCEL,
    false
  );

  constructor() {
    effect(() => {
      if (this.authStore.isSuccess()) {
        this.onCancel();
      }
    });
  }

  ngOnInit(): void {
    this.authStore.clearError();
    this.authStore.clearSuccess();
    this.buildForm();
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const oldPassword = control.get('oldPassword');
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    const updateError = (ctrl: AbstractControl | null, errorKey: string, isInvalid: boolean) => {
      if (!ctrl) return;
      const errors = { ...(ctrl.errors || {}) };
      isInvalid ? (errors[errorKey] = true) : delete errors[errorKey];
      ctrl.setErrors(Object.keys(errors).length ? errors : null);
    };

    // 1. New password must be different from current password
    updateError(newPassword, 'sameAsOld', !!(oldPassword?.value && newPassword?.value && oldPassword.value === newPassword.value));

    // 2. New password and confirm password must match
    updateError(confirmPassword, 'passwordMismatch', !!(newPassword?.value && confirmPassword?.value && newPassword.value !== confirmPassword.value));

    return null;
  }

  private buildForm(): void {
    this.dynamicForm = {
      formSection: [
        {
          controls: [
            {
              control: {
                ...getTextboxConfig(this.Login_Const.CURRENT_PASSWORD, 'oldPassword', undefined, InputType.password, 'outline'),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.Text,
              class: 'col-12',
            },
            {
              control: {
                ...getTextboxConfig(this.Login_Const.NEW_PASSWORD, 'newPassword', undefined, InputType.password, 'outline'),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.Text,
              class: 'col-12',
            },
            {
              control: {
                ...getTextboxConfig(this.Login_Const.CONFIRM_PASSWORD, 'confirmPassword', undefined, InputType.password, 'outline'),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.Text,
              class: 'col-12',
            }
          ]
        }
      ]
    };
  }

  submit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }
    const { oldPassword, newPassword } = this.changePasswordForm.getRawValue();
    this.authStore.changePassword({ oldPassword, newPassword });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

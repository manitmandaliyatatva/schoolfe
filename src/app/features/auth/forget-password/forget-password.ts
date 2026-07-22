import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/store/auth.store';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../shared/components/button/model/button.model';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../shared/components/dynamic-form/model/dynamic-form.model';
import { CommonTextboxConfig } from '../../../shared/components/textbox/model/textbox.model';
import { InputType } from '../../../shared/Enums/common.enum';
import { getButtonConfig, getTextboxConfig } from '../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../shared/models/form-control-base.model';
import { LOGIN_CONST } from '../auth.model';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonComponent, DynamicFormComponent],
  templateUrl: './forget-password.html',
  styleUrl: './forget-password.scss',
})
export class ForgetPassword implements OnInit {

  private readonly fb = inject(FormBuilder);
  authStore = inject(AuthStore);
  Login_Const = LOGIN_CONST;
  emailTextboxConfig = signal<CommonTextboxConfig>(
    getTextboxConfig(this.Login_Const.EMAIL_ADDRESS, 'email', undefined, InputType.email, 'outline')
  );
  sendResetLinkButtonConfig = signal<CommonButtonConfig>({
    ...getButtonConfig(
      () => { },
      'flat',
      'primary',
      this.Login_Const.SEND_RESET_LINK,
      true,
      () => false
    ),
    cssClasses: ['submit-btn'],
    type: 'submit'
  });
  dynamicForm!: DynamicForm;

  resetPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }
    this.authStore.forgotPassword(this.resetPasswordForm.getRawValue());
  }
  ngOnInit(): void {
    this.dynamicForm = {
      formSection: [
        {
          controls: [
            {
              control: {
                ...getTextboxConfig(this.Login_Const.EMAIL_ADDRESS, 'email', undefined, InputType.email, 'outline'),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.Text,
              class: 'col-sm-6 col-lg-6 col-xl-12',
            }
          ]
        }
      ]
    }
  }
}

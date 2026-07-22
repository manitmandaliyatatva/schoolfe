import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonHelperService } from '../../../core/services/common-helper.service';
import { AuthStore } from '../../../core/store/auth.store';
import { MenuPermissionStore } from '../../../core/store/menu-permission.store';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../shared/components/button/model/button.model';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../shared/components/dynamic-form/model/dynamic-form.model';
import { InputType } from '../../../shared/Enums/common.enum';
import {
  getButtonConfig,
  getTextboxConfig,
} from '../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../shared/models/form-control-base.model';
import { LOGIN_CONST } from '../auth.model';

import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import CommonHelper from '../../../core/helpers/common-helper';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, ButtonComponent, DynamicFormComponent, MatStepperModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  Login_Const = LOGIN_CONST;
  private readonly fb = inject(FormBuilder);
  loginStrore = inject(AuthStore);
  menuStore = inject(MenuPermissionStore);
  private readonly router = inject(Router);
  formControls!: DynamicForm;
  
  @ViewChild('stepper') stepper!: MatStepper;

  isStepperForm = signal<boolean>(false);
  roles = signal<{id: string, name: string, label: string, image: string}[]>([]);

  commonHelper = inject(CommonHelperService);
  loginButtonConfig = signal<CommonButtonConfig>(
    getButtonConfig(
      () => {},
      'flat',
      'primary',
      this.Login_Const.LOG_IN,
      true,
      () => false,
      undefined,
      undefined,
      undefined,
      undefined,
      ['submit-btn'],
      'submit'
    )
  );

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const store = this.loginStrore;
      if (store.isSuccess()) {
        if (store.isFirstTimeLogin()) {
          this.router.navigate(['/reset-password'], { queryParams: { token: store.tempToken() } });
        } else if (store.isLoggedIn()) {
          this.commonHelper.handlePostLogin();
        } else if (CommonHelper.isNotEmptyArray(store.userTypes())) {
          const mappedRoles = store.userTypes()!.map((userType) => {
            return {
              id: userType.userTypeId,
              name: userType.userTypeName,
              label: userType.userTypeName,
              image: `/${userType.userTypeName.toLowerCase()}.svg`
            };
          });
          this.roles.set(mappedRoles);
          this.isStepperForm.set(true);
          setTimeout(() => {
            if (this.stepper) {
              this.stepper.next();
            }
          });
        }
      }
    });
    this.buildFormControls();
  }

  submit = () => {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    
    this.loginStrore['login'](this.loginForm.getRawValue());
  };

  selectRole = (role: any) => {
    const payload = {
      ...this.loginForm.getRawValue(),
      userTypeId: role.id
    };
    this.loginStrore['login'](payload);
  };

  private buildFormControls = (): void => {
    this.formControls = {
      formSection: [
        {
          controls: [
            {
              control: {
                ...getTextboxConfig(
                  this.Login_Const.EMAIL_ADDRESS,
                  'email',
                  undefined,
                  InputType.email,
                  'outline'
                ),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.Text,
              class: 'col-sm-6 col-lg-6 col-xl-12',
            },
            {
              control: {
                ...getTextboxConfig(
                  this.Login_Const.PASSWORD,
                  'password',
                  undefined,
                  InputType.password,
                  'outline'
                ),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.Text,
              class: 'col-sm-6 col-lg-6 col-xl-12',
            }
          ],
        },
      ],
    };
  };
}

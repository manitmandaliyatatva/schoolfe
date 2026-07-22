import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatError } from '@angular/material/form-field';
import { ErrorMessageConfig } from './common-error.model';
import { UntilDestroy } from '@ngneat/until-destroy';
import CommonHelper from '../../../core/helpers/common-helper';

@UntilDestroy()
@Component({
  selector: 'common-error',
  standalone: true,
  imports: [CommonModule, MatError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
        @if (isError()) {
            <mat-error class="custom-error-msg">
                {{ errorMessage() }}
            </mat-error>
        }
    `
})
export class CommonErrorComponent {

  config = input<ErrorMessageConfig>();

  errors = computed<ValidationErrors | null>(() =>
    this.config()?.control?.errors ?? null
  );

  isError = computed<boolean>(() =>
    !!(this.config()?.control?.touched && this.config()?.control?.invalid && this.errors())
  );

  errorMessage = computed<string>(() => {
    const errs = this.errors();
    const control = this.config()?.control;
    if (!errs || !control) return '';

    const errorType = Object.keys(errs)[0];
    return CommonHelper.getErrorMessageFromErrorType(
      errorType,
      control,
      this.config()?.controlName
    );
  });
}

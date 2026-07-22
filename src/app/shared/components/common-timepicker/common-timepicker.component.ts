import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  ControlContainer,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { CommonErrorComponent } from '../common-error/common-error.component';
import { CommonTimepickerConfig } from './model/common-timepicker.model';

@Component({
  selector: 'app-common-timepicker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTimepickerModule,
    CommonErrorComponent,
  ],
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective,
    },
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './common-timepicker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonTimepickerComponent {
  config = input.required<CommonTimepickerConfig>();
  private readonly parentFormGroup = inject(ControlContainer, { optional: true });

  formGroup = (): FormGroup | null =>
    this.parentFormGroup instanceof FormGroupDirective
      ? this.parentFormGroup.form
      : null;

  control = (): FormControl | null => {
    const fg = this.formGroup();
    const controlName = this.config()?.formControlName;
    if (!fg || !controlName) return null;
    return fg.get(controlName) as FormControl;
  };

  isRequired = (): boolean => !!this.control()?.hasValidator(Validators.required);
  isError = (): boolean => !!(this.control()?.touched && this.control()?.errors);
  useFloatingLabel = (): boolean => this.config().isFloatLabel !== false;

  errorConfig = () => {
    const fg = this.formGroup();
    const control = fg?.get(this.config().formControlName);
    if (!control) return undefined;
    return {
      control,
      formStatus: fg?.status ?? null,
      controlName: this.config().label,
    };
  };
}

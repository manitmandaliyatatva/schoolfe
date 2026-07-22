import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  ViewEncapsulation,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MatDateFormats, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonDateRangeConfig, CommonDateRangeValue } from './model/common-daterange.model';
import { CommonErrorComponent } from '../common-error/common-error.component';
import CommonHelper from '../../../core/helpers/common-helper';

@Component({
  selector: 'app-common-daterange',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    CommonErrorComponent
  ],
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective,
    },
  ],
  providers: [
    {
      provide: MAT_DATE_FORMATS,
      deps: [forwardRef(() => CommonDaterangeComponent)],
      useFactory: (component: CommonDaterangeComponent): MatDateFormats =>
        component.dateFormats,
    },
  ],
  templateUrl: './common-daterange.component.html',
  styleUrl: './common-daterange.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class CommonDaterangeComponent {
  config = input.required<CommonDateRangeConfig>();
  private readonly parentFormGroup = inject(ControlContainer, { optional: true });

  @HostBinding('class') hostClass = 'common-daterange-host';

  get formGroup(): FormGroup | null {
    return this.parentFormGroup instanceof FormGroupDirective ? this.parentFormGroup.form : null;
  }

  get startControl(): FormControl | null {
    const cfg = this.config();
    if (this.formGroup && cfg?.startFormControlName) {
      return this.formGroup.get(cfg.startFormControlName) as FormControl;
    }
    return null;
  }

  get endControl(): FormControl | null {
    const cfg = this.config();
    if (this.formGroup && cfg?.endFormControlName) {
      return this.formGroup.get(cfg.endFormControlName) as FormControl;
    }
    return null;
  }

  get minDate(): Date | null {
    return this.config()?.min?.() ?? null;
  }

  get maxDate(): Date | null {
    return this.config()?.max?.() ?? null;
  }

  get dateFilter(): ((date: Date | null) => boolean) | null {
    return this.config()?.filterDate ?? null;
  }

  get dateFormats(): MatDateFormats {
    return this.config()?.dateFormats ?? MAT_NATIVE_DATE_FORMATS;
  }

  get toggleIcon(): string {
    return this.config()?.customIcon || 'calendar_month';
  }

  get fromDateControl(): AbstractControl | null {
    const name = this.config().startFormControlName;
    return name ? this.formGroup?.get(name) ?? null : null;
  }

  get toDateControl(): AbstractControl | null {
    const name = this.config().endFormControlName;
    return name ? this.formGroup?.get(name) ?? null : null;
  }

  onDateRangeChange = (): void => {
    const cfg = this.config();

    const value: CommonDateRangeValue = {
      start: this.startControl?.value
        ? CommonHelper.toDateOnly(this.startControl.value as any)
        : null,
      end: this.endControl?.value
        ? CommonHelper.toDateOnly(this.endControl.value as any)
        : null,
    };

    this.startControl.setValue(value.start, { emitEvent: false });
    this.endControl.setValue(value.end, { emitEvent: false });

    cfg?.onChangeDateRange?.(value);
  };
  onFocus = (picker: any): void => {
    if (this.config()?.openOnFocus && !picker.opened) {
      picker.open();
    }
  };

  onTab = (picker: any): void => {
    if (this.config()?.openPickerOnTab && !picker.opened) {
      picker.open();
    }
  };

  clearValue = (): void => {
    this.startControl?.setValue(null);
    this.endControl?.setValue(null);
    this.onDateRangeChange();
  };

  get isError(): boolean {
    return !!(this.startControl?.invalid && this.startControl?.touched) || !!(this.endControl?.invalid && this.endControl?.touched);
  }

  isRequired(): boolean {
    if (!this.startControl) return false;
    if (this.startControl.hasValidator(Validators.required)) return true;
    const validator = this.startControl.validator?.({} as AbstractControl);
    return !!validator?.['required'];
  }

  errorConfig = () => {
    const from = this.fromDateControl;
    const to = this.toDateControl;
    
    if (!from || !to) return undefined;

    const control = from.errors && to.errors ? from : (from.errors ? from : to.errors ? to : null);

    if (!control) return undefined;
    return {
      control,
      formStatus: this.formGroup?.status ?? null,
      controlName: this.config().label
    };
  };

}

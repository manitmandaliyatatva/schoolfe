import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  input
} from '@angular/core';
import {
  ControlContainer,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MAT_NATIVE_DATE_FORMATS, MatDateFormats, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { CommonDatepickerConfig, DateFormats } from './model/common-datepicker.model';
import { CommonErrorComponent } from '../common-error/common-error.component';
import { CustomDateAdapter } from './custom-date-adapter';
import moment from 'moment';
import CommonHelper from '../../../core/helpers/common-helper';
import { CommonModule } from '@angular/common';
import { CommonWarningComponent } from '../common-warning/common-warning.component';
import { CommonDateFormat } from '../../../core/constants/date-format.constant';


@Component({
  selector: 'app-common-datepicker',
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
    MatMenuModule,
    CommonErrorComponent,
    CommonWarningComponent
  ],
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective,
    },
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DateFormats },
  ],
  templateUrl: './common-datepicker.component.html',
  styleUrl: './common-datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class CommonDatepickerComponent implements OnInit {
  config = input.required<CommonDatepickerConfig>();
  private readonly parentFormGroup = inject(ControlContainer, { optional: true });
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dateAdapter = inject(DateAdapter);

  ngOnInit(): void {
    const mode = this.config()?.mode || 'day';
    if (this.dateAdapter instanceof CustomDateAdapter) {
      this.dateAdapter.mode = mode;
    }
  }

  @HostBinding('class') hostClass = 'common-datepicker-host';

  get formGroup(): FormGroup | null {
    return this.parentFormGroup instanceof FormGroupDirective
      ? this.parentFormGroup.form
      : null;
  }

  get control(): FormControl | null {
    const cfg = this.config();
    if (this.formGroup && cfg?.formControlName) {
      return this.formGroup.get(cfg.formControlName) as FormControl;
    }
    return null;
  }

  get isError(): boolean {
    return !!(this.control?.touched && this.control?.errors);
  }

  get isRequired(): boolean {
    return !!this.control?.hasValidator(Validators.required);
  }

  get useFloatingLabel(): boolean {
    return this.config().isFloatLabel !== false;
  }

  get minDate(): Date | null {
    return this.config()?.min?.() ?? null;
  }

  get maxDate(): Date | null {
    return this.config()?.max?.() ?? null;
  }

  get minDateMoment(): any {
    const min = this.minDate;
    return min ? this.dateAdapter.deserialize(min) : null;
  }

  get maxDateMoment(): any {
    const max = this.maxDate;
    return max ? this.dateAdapter.deserialize(max) : null;
  }

  get selectedDates(): Date[] {
    const value = this.control?.value;
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map(val => CommonHelper.parseDateString(val))
        .filter((d): d is Date => d !== null);
    }
    const parsed = CommonHelper.parseDateString(String(value));
    return parsed ? [parsed] : [];
  }

  get formattedSelectedDates(): string {
    const dates = this.selectedDates;
    if (!dates.length) return '';
    return dates
      .map(d => CommonHelper.toFormattedDate(d, CommonDateFormat.DDMMYYYY_WithSlash))
      .join(', ');
  }

  isSameDate(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  /**
   * Computed filter function — returns a NEW function reference every time config() changes.
   * This forces mat-calendar to re-evaluate disabled dates whenever the config is updated
   * (e.g. when exam dates change and a previously-disabled holiday date becomes available).
   */
  readonly dateFilterFn = computed(() => {
    const cfg = this.config(); // reactive dependency — new ref = new function
    return (date: Date | null): boolean => {
      if (!date) return true;
      const jsDate = (date as any).toDate ? (date as any).toDate() : new Date(date);

      if (cfg.disableSundays && jsDate.getDay() === 0) return false;

      if (cfg.disabledDates?.length) {
        const isDisabled = cfg.disabledDates.some(d =>
          d.getFullYear() === jsDate.getFullYear() &&
          d.getMonth() === jsDate.getMonth() &&
          d.getDate() === jsDate.getDate()
        );
        if (isDisabled) return false;
      }

      if (cfg.filterDate) return cfg.filterDate(jsDate);
      return true;
    };
  });

  get dateFormats(): MatDateFormats {
    return this.config()?.dateFormats ?? MAT_NATIVE_DATE_FORMATS;
  }

  get toggleIcon(): string {
    return this.config()?.customIcon || 'calendar_month';
  }

  onDateChange = (date: Date | null): void => {
    let formattedDate: string | null = null;
    if (date) {
      if (this.config()?.mode === 'year') {
        formattedDate = moment(date).format('YYYY');
      } else {
        formattedDate = CommonHelper.toDateOnly(date as any);
      }
    }
    this.control?.setValue(formattedDate, { emitEvent: false });
    this.cdr.markForCheck();
    const cfg = this.config();
    if (cfg?.onChangeDate) {
      cfg.onChangeDate(formattedDate as any);
    }
  };

  /** Directly update .selected-date-cell on calendar buttons — bypasses Angular CD/overlay detach */
  private syncCalendarCellClasses(selectedDateStrs: string[]): void {
    const selectedSet = new Set(selectedDateStrs);
    const cells = document.querySelectorAll<HTMLButtonElement>(
      '.multi-datepicker-menu button.mat-calendar-body-cell'
    );
    cells.forEach(cell => {
      const label = cell.getAttribute('aria-label'); // e.g. "July 25, 2026"
      if (!label) return;
      const dateStr = CommonHelper.toDateOnly(new Date(label));
      if (!dateStr) return;
      if (selectedSet.has(dateStr)) {
        cell.classList.add('selected-date-cell');
      } else {
        cell.classList.remove('selected-date-cell');
      }
    });
  }

  onMultiDateSelected = (date: Date | null): void => {
    if (!date) return;
    const jsDate = (date as any).toDate ? (date as any).toDate() : new Date(date);
    const dateStr = CommonHelper.toDateOnly(jsDate);

    const rawValues = Array.isArray(this.control?.value) ? this.control.value : [];
    const currentValue: string[] = rawValues
      .map((v: any) => {
        const d = (v as any).toDate ? (v as any).toDate() : new Date(v);
        return CommonHelper.toDateOnly(d);
      })
      .filter((v: string) => !!v);

    const index = currentValue.indexOf(dateStr);
    if (index > -1) {
      currentValue.splice(index, 1);
    } else {
      currentValue.push(dateStr);
    }

    this.control?.setValue(currentValue);
    this.control?.markAsTouched();
    this.control?.markAsDirty();

    // Directly update DOM classes on calendar cells — no Angular CD dependency
    this.syncCalendarCellClasses(currentValue);

    const cfg = this.config();
    if (cfg?.onChangeDate) {
      cfg.onChangeDate(currentValue);
    }
  };


  // Static readonly function — reads this.selectedDates LIVE at call time
  // This is critical: when stateChanges.next() triggers _init(), the form control
  // value is already updated, so selectedDates returns the correct fresh state.
  readonly dateClass = (date: Date | null): string => {
    if (!date) return '';
    const jsDate = (date as any).toDate ? (date as any).toDate() : new Date(date);
    return this.selectedDates.some(d => this.isSameDate(d, jsDate)) ? 'selected-date-cell' : '';
  };

  chosenYearHandler = (normalizedYear: any, datepicker: any): void => {
    if (this.config()?.mode === 'year') {
      const momentDate = moment(normalizedYear);
      const formattedDate = momentDate.format('YYYY');
      this.control?.setValue(formattedDate);
      datepicker.close();
      const cfg = this.config();
      if (cfg?.onChangeDate) {
        cfg.onChangeDate(formattedDate);
      }
    }
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
    if (this.config().multiple) {
      this.control?.setValue([]);
      this.control?.markAsTouched();
      this.control?.markAsDirty();
      this.cdr.markForCheck();
      const cfg = this.config();
      if (cfg?.onChangeDate) {
        cfg.onChangeDate([]);
      }
    } else {
      this.control?.setValue(null);
      this.onDateChange(null);
    }
  };

  errorConfig = () => {
    const control = this.formGroup?.get(this.config().formControlName);
    if (!control) return undefined;
    return {
      control,
      formStatus: this.formGroup?.status ?? null,
      controlName: this.config().label
    };
  };
}

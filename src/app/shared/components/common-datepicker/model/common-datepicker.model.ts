import { MatFormFieldAppearance } from '@angular/material/form-field';
import { MatDateFormats } from '@angular/material/core';

export interface CommonDatepickerConfig {
  id?: string;
  formControlName: string;
  label: string;
  isFloatLabel?: boolean;
  appearance?: MatFormFieldAppearance;
  customValidationMessage?: (errorType: string) => string;
  placeholder?: string;
  /** Custom mat-icon name to use as the datepicker toggle icon. Defaults to 'calendar_month'. */
  customIcon?: string;
  /** If true, the datepicker panel opens automatically when the input receives focus. */
  openOnFocus?: boolean;
  /** If true, the datepicker panel opens when the user tabs into the input. */
  openPickerOnTab?: boolean;
  /** Minimum selectable date (can be dynamic via a function). */
  min?: () => Date;
  /** Maximum selectable date (can be dynamic via a function). */
  max?: () => Date;
  /** Fired when the selected date changes. Receives the new Date value or array of date strings. */
  onChangeDate?: (data: any) => void;
  /** Return false to disable a specific date in the calendar. */
  filterDate?: (date: Date | null) => boolean;
  /** Optional Angular Material date formats (uses default formats when not provided). */
  dateFormats?: MatDateFormats;

  disableSundays?: boolean;
  /** List of specific dates to disable (e.g. holidays) */
  disabledDates?: Date[];
  /** Optional callback to return a warning message based on the selected date value. */
  getWarning?: (value: string | null) => string | null;
  /** If true, allows selecting multiple dates. */
  multiple?: boolean;
  /** If false, hides the clear (close) button. Default is true. */
  allowClear?: boolean;
  /** View mode for date picker. Defaults to 'day'. */
  mode?: 'year' | 'month' | 'day';
}

export const defaultDateFormat = 'DD/MM/YYYY';

export const DateFormats = {
  parse: {
    dateInput: defaultDateFormat
  },
  display: {
    dateInput: defaultDateFormat,
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
    parseInput: 'DD/MM/YYYY HH:mm:ss',
    fullPickerInput: 'DD/MM/YYYY HH:mm:ss',
    datePickerInput: 'DD/MM/YYYY',
    timePickerInput: 'HH:mm:ss',
  }
}

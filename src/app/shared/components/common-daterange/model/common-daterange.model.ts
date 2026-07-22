import { MatFormFieldAppearance } from '@angular/material/form-field';
import { MatDateFormats } from '@angular/material/core';

export interface CommonDateRangeValue {
  start: Date | null | string;
  end: Date | null | string;
}

export interface CommonDateRangeConfig {
  id?: string;
  label: string;
  startFormControlName: string;
  endFormControlName: string;
  isFloatLabel?: boolean;
  appearance?: MatFormFieldAppearance;
  startPlaceholder?: string;
  endPlaceholder?: string;
  separator?: string;
  hint?: string;
  customIcon?: string;
  openOnFocus?: boolean;
  openPickerOnTab?: boolean;
  min?: () => Date;
  max?: () => Date;
  filterDate?: (date: Date | null) => boolean;
  customValidationMessage?: (errorType: string, controlType: 'start' | 'end') => string;
  onChangeDateRange?: (data: CommonDateRangeValue) => void;
  /** Optional Angular Material date formats (uses default formats when not provided). */
  dateFormats?: MatDateFormats;
}

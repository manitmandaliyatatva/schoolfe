import { MatFormFieldAppearance } from '@angular/material/form-field';

export interface CommonTimepickerConfig {
  id?: string;
  formControlName: string;
  label: string;
  isFloatLabel?: boolean;
  appearance?: MatFormFieldAppearance;
  placeholder?: string;
  minTime?: string;
  maxTime?: string;
}

import { MatCheckboxChange } from '@angular/material/checkbox';
import { OrientationType } from '../../../models/orientation.model';
import { FormControlBaseConfig } from '../../../models/form-control-base.model';

export interface CommonCheckboxOption {
  text: string;
  value: number | string;
}

export interface CommonCheckboxChangeEvent {
  event: MatCheckboxChange;
  option: CommonCheckboxOption;
  selectedValues: Array<number | string>;
}

export interface CommonCheckboxConfig extends FormControlBaseConfig {
  orientation?: OrientationType;
  disabled?: boolean;
  options: CommonCheckboxOption[];
  change?: (event: CommonCheckboxChangeEvent) => void;
  disableCallback?: (value: number | string) => boolean;
  cssClassCallback?: (option: CommonCheckboxOption) => string;
}

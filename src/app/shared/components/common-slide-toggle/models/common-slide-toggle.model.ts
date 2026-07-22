import { FormControlBaseConfig } from '../../../models/form-control-base.model';

export interface CommonSlideToggleConfig extends FormControlBaseConfig {
  labelPosition?: 'before' | 'after';
  disabled?: boolean;
  hideIcon?: boolean;
  cssClass?: string;
  change?: (event: boolean) => void;
  color?: 'primary' | 'accent' | 'warn';
  isDisable?(data?: any, formControl?: any): boolean
}

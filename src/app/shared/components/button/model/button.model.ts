import { TooltipPosition } from '@angular/material/tooltip';
export interface CommonButtonConfig {
  callBackId?: string;
  variant: 'raised' | 'flat' | 'stroked' | 'fab' | 'icon' | 'basic';
  color: 'basic' | 'primary' | 'warn' | 'accent';
  isButtonHidden?: boolean;
  icon?: string;
  iconUrl?: string;
  badge?: string;
  badgeCallback?(val?: string): string;
  isPrimary?: boolean;
  buttonText?: string;
  number?: number;
  chipBackgroundColor?: 'grey' | 'black';
  tooltipText?: string;
  tooltipPosition?: TooltipPosition;
  callback(element: any): void;
  disableCallBack?(): boolean;
  cssClasses?: string[];
  cssStyles?: string[];
  isBtnVisible?(): boolean;
  isButtonVisible?: boolean;
  disabled?: boolean;
  visibleCallback?: (element: any) => boolean;
  value?: string | number;
  isFilterButton?: boolean;
  type?: 'submit' | 'reset' | 'button';
  isGlobalRefreshButton?: boolean;
}

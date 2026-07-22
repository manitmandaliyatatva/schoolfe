import { TemplateRef } from '@angular/core';

export interface DetailViewField {
  label: string;
  key: string;
  span?: 2 | 3 | 4 | 6;
  type?: 'text' | 'date' | 'status-chip' | 'custom';
  dateFormat?: string;
  customTemplate?: TemplateRef<any>;
  cssClass?: string;
}

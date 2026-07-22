import { TemplateRef, Type } from '@angular/core';
import { CommonButtonConfig } from '../../../button/model/button.model';

export interface DialogAction<TResult = boolean> extends CommonButtonConfig {
  closeOnClick?: boolean;
  result?: TResult;
}

export interface DialogOptions<TData = any, TResult = boolean> {
  component?: Type<any>;
  template?: TemplateRef<any>;
  title?: string;
  data?: TData;
  showHeader?: boolean;
  showCloseButton?: boolean;
  closeResult?: TResult;
  headerClass?: string | string[];
  contentClass?: string | string[];
  footerClass?: string | string[];
  headerActions?: DialogAction<TResult>[];
  actions?: DialogAction<TResult>[];
}

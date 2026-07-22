import { CommonModule } from '@angular/common';
import { Component, input, OnInit, signal, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import CommonHelper from '../../../core/helpers/common-helper';
import { generateGUID } from '../../../core/helpers/form-utils';
import { CommonButtonConfig } from './model/button.model';
import { GlobalRefreshService } from '../../../core/services/global-refresh.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'common-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './button.component.html',
})
export class ButtonComponent implements OnInit {
  config = input.required<CommonButtonConfig>();
  inputId = signal('');

  private readonly globalRefreshService = inject(GlobalRefreshService);

  get isIconButton(): boolean {
    return !!(this.config().icon || this.config().iconUrl) &&
           CommonHelper.isEmpty(this.config().buttonText);
  }

  get btnColor(): string {
    return this.config().color;
  }

  get cssClasses(): string {
    return this.config().cssClasses && this.config().cssClasses!.length > 0
      ? this.config().cssClasses!.join(' ')
      : '';
  }

  get btnType(): string {
    return this.config().type ?? 'button';
  }

  get chipStyle(): string {
    const color =
      this.config().chipBackgroundColor === 'grey'
        ? 'height: 20px!important; background-color:#e0e0e0'
        : 'height: 20px!important; background-color:#000000';
    return this.config().chipBackgroundColor ? color : 'height: 20px!important';
  }

  get cssStyles(): string {
    return this.config().cssStyles && this.config().cssStyles!.length > 0
      ? this.config().cssStyles!.join(';')
      : '';
  }

  get chipLabelStyle(): string {
    if (this.config().chipBackgroundColor)
      return this.config().chipBackgroundColor === 'grey'
        ? 'font-size:12px;color:#000000'
        : 'font-size:12px;color:#ffffff';
    else return '';
  }

  get isBtnVisible(): boolean {
    return this.config().visibleCallback ? this.config().visibleCallback!({}) : true;
  }

  ngOnInit(): void {
    this.inputId.set(generateGUID(this.config().buttonText?.trim()!));

    const { callback, isGlobalRefreshButton } = this.config();
    // Subscribe to global Refresh
    if (isGlobalRefreshButton && callback && typeof callback === 'function') {
      this.globalRefreshService.globalRefreshObservable.pipe(untilDestroyed(this))
        .subscribe(() => {
          callback(null);
        });
    }
  }

  onClick = (event: any): void => {
    this.config().callback?.(event);
  };

  isDisable = (): boolean => {
    if (this.config().disableCallBack) {
      return this.config().disableCallBack!();
    }
    return false;
  };
}

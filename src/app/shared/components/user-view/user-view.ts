import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { SafeImageComponent } from '../safe-image/safe-image.component';
import { SafeImageConfig } from '../safe-image/model/safe-image.model';
import { CommonDateFormat } from '../../../core/constants/date-format.constant';
import { UserViewData, UserViewLabels } from './model/user-view.model';
import { ButtonComponent } from '../button/button.component';
import { CommonButtonConfig } from '../button/model/button.model';
import { getButtonConfig } from '../../functions/config-function';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';

import { StatusChipComponent } from '../status-chip/status-chip.component';
import { ContactFormatPipe } from '../../pipes/contact-format.pipe';

@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTabsModule,
    SafeImageComponent,
    ButtonComponent,
    StatusChipComponent,
    ContactFormatPipe
  ],
  templateUrl: './user-view.html',
  styleUrl: './user-view.scss'
})
export class UserView {
  data = input<UserViewData | null>(null);
  labels = input<UserViewLabels | null>(null);
  readonly systemConst = signal(SYSTEM_CONST);

  protected readonly dateFormat = CommonDateFormat.DDMMYYYY_WithSlash;

  protected readonly safeImageConfig = computed<SafeImageConfig>(() => ({
    src: this.data()?.photo,
    alt: this.data()?.fullName,
    userName: this.data()?.fullName
  }));

  readonly backBtnConfig = computed<CommonButtonConfig>(() => {
    const label = this.labels()?.backButton || this.systemConst().ACTION_BUTTONS.BACK;
    const onBack = this.data()?.onBack;

    return {
      ...getButtonConfig(() => onBack?.(), 'stroked', 'primary', label, false),
      cssClasses: ['btn', 'back-btn', 'secondary-btn'],
    };
  });

  readonly actionBtnConfigs = computed<CommonButtonConfig[]>(() => {
    const actions = this.data()?.actionButtons ?? [];

    return actions
      .filter((btn) => !btn.isHidden)
      .map((btn) => ({
        ...getButtonConfig(() => btn.callback(), 'stroked', 'primary', btn.label, false, undefined, btn.icon),
        cssClasses: ['btn', 'user-view-action-btn', btn.cssClass || 'edit-action-btn', this.getFormButtonClass(btn.cssClass)],
      }));
  });

  getFormButtonClass = (cssClass?: string): string => {
    const resolvedClass = cssClass ?? 'edit-action-btn';
    return resolvedClass === 'suspend-action-btn' || resolvedClass === 'unsuspend-action-btn'
      ? 'secondary-btn'
      : 'configuration-form-save-btn';
  }
}

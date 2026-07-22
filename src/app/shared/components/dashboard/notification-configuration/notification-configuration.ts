import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonComponent } from '../../button/button.component';
import { CommonButtonConfig } from '../../button/model/button.model';
import { getButtonConfig } from '../../../functions/config-function';
import { GenericDialog } from '../../generic-dialog/generic-dialog';
import { SYSTEM_CONST } from '../../../../core/constants/system.constant';
import { API } from '../../../../shared/constants/api-url';
import {
  NotificationEventSetting,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CONFIG_CONST,
  UpdateNotificationSetting,
  NotificationConfigurationStore,
  NotificationChannelKey
} from './model/notification-configuration.model';
import CommonHelper from '../../../../core/helpers/common-helper';

@Component({
  selector: 'app-notification-configuration',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    ButtonComponent,
  ],
  templateUrl: './notification-configuration.html',
  styleUrl: './notification-configuration.scss',
  providers: [NotificationConfigurationStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationConfiguration implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<GenericDialog, boolean>);
  private readonly notificationStore = inject(NotificationConfigurationStore);

  private readonly updatedSettings: UpdateNotificationSetting[] = [];

  readonly NOTIFICATION_CONFIG_CONST = NOTIFICATION_CONFIG_CONST;
  readonly channels = NOTIFICATION_CHANNELS;

  readonly categories = this.notificationStore.list;
  readonly isLoading = this.notificationStore.isLoading;

  saveBtn = signal<CommonButtonConfig>(
    getButtonConfig(() => this.submit(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true)
  );

  cancelBtn = signal<CommonButtonConfig>(
    getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false)
  );

  ngOnInit(): void {
    this.notificationStore.getAll({
      endpoint: API.NOTIFICATION.GET_SETTINGS
    });
  }

  toggleChannel = (event: NotificationEventSetting, channelKey: NotificationChannelKey, checked: boolean): void => {
    event[channelKey] = checked;

    const existingIndex = this.updatedSettings.findIndex(
      item => item.notificationEventId === event.notificationEventId
    );

    const payload: UpdateNotificationSetting = {
      notificationEventId: event.notificationEventId,
      isInAppEnabled: event.isInAppEnabled,
      isEmailEnabled: event.isEmailEnabled,
      isSmsEnabled: event.isSmsEnabled,
      isPushEnabled: event.isPushEnabled
    };

    if (existingIndex > -1) {
      this.updatedSettings[existingIndex] = payload;
    } else {
      this.updatedSettings.push(payload);
    }

    this.notificationStore.setList([...this.notificationStore.list()]);
  }

  submit = (): void => {
    if (!CommonHelper.isNotEmptyArray(this.updatedSettings)) {
      this.dialogRef.close(true);
      return;
    }

    this.notificationStore.createWithResult({
      endpoint: API.NOTIFICATION.UPDATE_SETTINGS,
      body: { settings: this.updatedSettings }
    } as any).subscribe({
      next: () => {
        this.dialogRef.close(true);
      }
    });
  }

  onCancel = (): void => {
    this.dialogRef.close(false);
  }
}

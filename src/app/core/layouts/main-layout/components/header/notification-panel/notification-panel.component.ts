import { ChangeDetectionStrategy, Component, inject, output, ViewChild, computed, ChangeDetectorRef } from '@angular/core';
import { MatMenuModule, MatMenuPanel } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../../../services/notification.service';
import { Notification } from '../../../../../models/notification.model';
import { NoticeDetailDialog } from '../../../../../../shared/components/notice-detail-dialog/notice-detail-dialog';
import { HEADER_CONST } from '../model/header.model';
import { CommonButtonConfig } from '../../../../../../shared/components/button/model/button.model';
import { getButtonConfig } from '../../../../../../shared/functions/config-function';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import CommonHelper from '../../../../../helpers/common-helper';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [
    MatMenuModule,
    MatIconModule,
    MatDialogModule,
    ButtonComponent
  ],
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPanelComponent {
  @ViewChild('notificationMenu', { static: true }) notificationMenu!: MatMenuPanel;

  closePanel = output<void>();

  readonly HEADER_CONST = HEADER_CONST;

  private readonly dialog = inject(MatDialog);
  readonly notificationService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  onMenuOpened = (): void => {
    this.cdr.markForCheck();
  };

  isNotificationEmpty = computed<boolean>(() => !this.notificationService.notifications() || !CommonHelper.isNotEmptyArray(this.notificationService.notifications()));

  markAllAsReadBtn = computed<CommonButtonConfig>(() => getButtonConfig(
    (event: Event) => {
      if (event) {
        event.stopPropagation();
      }
      this.notificationService.markAllAsRead();
    },
    'icon',
    'basic',
    undefined,
    undefined,
    () => this.isNotificationEmpty(),
    'done_all',
    undefined,
    HEADER_CONST.MARK_ALL_AS_READ,
    'above',
    ['mark-all-read-btn']
  ));

  openNotificationDialog = (notification: Notification): void => {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.notificationId);
    }
    this.closePanel.emit();
    
    this.dialog.open(NoticeDetailDialog, {
      width: '520px',
      autoFocus: false,
      data: {
        noticeId: notification.notificationId,
        title: notification.title,
        description: notification.message,
        publishDate: notification.createdOn,
        isImportant: notification.title?.toLowerCase().includes('urgent') || false,
      }
    });
  }

  markAsRead = (notification: Notification, event: Event): void => {
    event.stopPropagation();
    this.notificationService.markAsRead(notification.notificationId);
  }

  viewDetails = (notification: Notification, event: Event): void => {
    event.stopPropagation();
    this.openNotificationDialog(notification);
  }

  getTimeAgo = (dateString: string): string => {
    if (!dateString) return '';
    let normalized = dateString.trim();
    if (!normalized.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(normalized)) {
      normalized += 'Z';
    }
    const date = new Date(normalized);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `Just now`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}

import { createGenericStore } from '../../../../../core/store/resource.store';

export interface NotificationEventSetting {
  notificationEventId: string;
  eventCode: string;
  eventName: string;
  category: string;
  isInAppEnabled: boolean;
  isEmailEnabled: boolean;
  isSmsEnabled: boolean;
  isPushEnabled: boolean;
}

export interface NotificationCategorySetting {
  category: string;
  events: NotificationEventSetting[];
}

export type NotificationChannelKey = 'isInAppEnabled' | 'isEmailEnabled' | 'isSmsEnabled' | 'isPushEnabled';

export interface NotificationChannel {
  key: NotificationChannelKey;
  label: string;
  icon: string;
}

export interface UpdateNotificationSetting {
  notificationEventId: string;
  isInAppEnabled: boolean;
  isEmailEnabled: boolean;
  isSmsEnabled: boolean;
  isPushEnabled: boolean;
}

export const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  { key: 'isInAppEnabled', label: 'In-App', icon: 'notifications' },
  { key: 'isEmailEnabled', label: 'Email', icon: 'mail' },
  { key: 'isSmsEnabled', label: 'SMS', icon: 'sms' },
  { key: 'isPushEnabled', label: 'Push', icon: 'smartphone' }
];

export const NOTIFICATION_CONFIG_CONST = {
  PAGE_TITLE: 'Configure Notifications',
  TITLE: 'Notification Configuration',
  SUBTITLE: 'Customize how and where you receive notifications for different school events.',
  SAVE: 'Save Settings',
  CANCEL: 'Cancel',
  NO_SETTINGS: 'No configuration settings found.'
};

export const NotificationConfigurationStore = createGenericStore<NotificationCategorySetting>();

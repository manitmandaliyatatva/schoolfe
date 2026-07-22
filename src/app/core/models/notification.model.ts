import { createGenericStore } from "../store/resource.store";

export interface Notification {
    notificationId: string;
    title: string;
    message: string;
    createdOn: string;
    isRead?: boolean;
}

export const NOTIFICATION_CONST = {
    RECEIVE_METHOD: 'ReceiveNotification',
    NEW_NOTIFICATION_TITLE: 'New Notification'
};

export const NotificationStore = createGenericStore<Notification>();
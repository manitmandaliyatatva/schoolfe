import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { NotificationStore, Notification, NOTIFICATION_CONST } from '../models/notification.model';
import { API, BASE_API_URL } from '../../shared/constants/api-url';
import * as signalR from '@microsoft/signalr';
import { AuthStore } from '../store/auth.store';
import { ToastrHelperService } from './toster-helper.service';
import { buildGridListRequest } from '../../shared/helpers/grid.helper';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  readonly notificationStore = inject(NotificationStore);
  private readonly authStore = inject(AuthStore);
  private readonly toastr = inject(ToastrHelperService);

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal<number>(0);

  isSignalConnected = false;

  readonly latestNotification = computed(() => this.notifications()[0]);

  private hubConnection: signalR.HubConnection | undefined;

  constructor() {
    effect(() => {
      if (this.authStore.isLoggedIn()) {
        this.getNotifications();
      } else {
        this.stopConnection();
        this.setNotifications([]);
        this.setUnreadCount(0);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      if (!this.notificationStore.isLoading() && this.notificationStore.isSuccess()) {
        this.startConnection();
        this.setNotifications(this.notificationStore.list() || []);
        this.setUnreadCount((this.notificationStore.list() || []).filter(x => !x.isRead).length);
      }
    });
  }

  setNotifications = (notifications: Notification[]) => {
    this.notifications.set(notifications);
  }

  setUnreadCount = (count: number) => {
    this.unreadCount.set(count);
  }

  public startConnection = () => {
    if (this.hubConnection) {
      if (this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
        return;
      }
      this.stopConnection();
    }

    const hubUrl = `${BASE_API_URL.replace(/\/$/, '')}${API.NOTIFICATION.HUB_URL}`;
    
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          return this.authStore.accessToken() || '';
        }
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.onreconnected((connectionId) => {
      this.getNotifications();
    });

    this.hubConnection
      .start()
      .then(() => {
        this.addReceiveNotificationListener();
        this.isSignalConnected = true;
      })
      .catch((err) => {
        console.error('SignalR: Connection failed:', err);
      });
  }

  public stopConnection = () => {
    if (this.hubConnection) {
      this.hubConnection.stop().catch((err) => {
        console.error('SignalR: Stop connection failed:', err);
      });
      this.hubConnection = undefined;
    }
  }

  private handleForceLogout = (message: string) => {
    this.toastr.showWarningMessage(message);
    this.authStore.frontendLogout();
  }

  public addReceiveNotificationListener = () => {
    this.hubConnection?.on(NOTIFICATION_CONST.RECEIVE_METHOD, (notification: Notification) => {
      // console.log('SignalR: Received live notification:', notification);
      this.addNotification(notification);
      this.toastr.showInfoMessage(notification.message, notification.title || NOTIFICATION_CONST.NEW_NOTIFICATION_TITLE);
    });

    this.hubConnection?.on('ForceLogout', (message: string) => {
      this.handleForceLogout(message);
    });
  }

  addNotification = (notification: Notification) => {
    this.notifications.update(list => [notification, ...list]);
    this.unreadCount.update(x => x + 1);
    this.notificationStore.setList(this.notifications());
  }

  markAsRead = (notificationId: string) => {
    const notification = this.notifications().find(n => n.notificationId === notificationId);
    if (!notification) {
      return;
    }

    this.notifications.update(list => list.filter(n => n.notificationId !== notificationId));
    this.setUnreadCount(this.notifications().filter(x => !x.isRead).length);
    this.notificationStore.setList(this.notifications());

    this.notificationStore.update({
      endpoint: API.NOTIFICATION.MARK_AS_READ,
      params: { notificationId }
    });
  }

  getNotifications = () => {
    this.notificationStore.getAll({
      endpoint: API.NOTIFICATION.GET_ALL,
      body : buildGridListRequest(null)
    })
  }

  markAllAsRead = () => {
    this.notifications.set([]);
    this.setUnreadCount(0);
    this.notificationStore.setList([]);

    this.notificationStore.update({
      endpoint: API.NOTIFICATION.MARK_ALL_AS_READ,
      body: {} as any
    });
  }
}

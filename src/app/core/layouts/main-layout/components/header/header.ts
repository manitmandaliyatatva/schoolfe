import { ChangeDetectionStrategy, Component, inject, input, output, signal, computed } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LOGIN_CONST } from '../../../../../features/auth/auth.model';
import { ChangePassword } from '../../../../../features/auth/change-password/change-password';
import { Logout } from '../../../../../features/auth/logout/logout';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { getButtonConfig } from '../../../../../shared/functions/config-function';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { AuthStore } from '../../../../store/auth.store';
import { HEADER_CONST } from './model/header.model';
import { GridStateStore } from '../../../../store/grid-state.store';
import { CommonHelperService } from '../../../../services/common-helper.service';
import { WidgetService } from '../../../../services/widget.service';
import { WidgetConfiguration } from '../../../../../shared/components/dashboard/widget-configuration/widget-configuration';
import { WIDGET_CONFIG_CONST } from '../../../../../shared/components/dashboard/widget-configuration/model/widget-configuration.model';
import { NotificationConfiguration } from '../../../../../shared/components/dashboard/notification-configuration/notification-configuration';
import { NOTIFICATION_CONFIG_CONST } from '../../../../../shared/components/dashboard/notification-configuration/model/notification-configuration.model';
import { AdminDashboardWidgets, StudentDashboardWidgets, TeacherDashboardWidgets, DashboardWidgetsVisibility, WidgetConfigItem } from '../../../../../shared/components/dashboard/widget-configuration/model/widget-configuration.model';
import { HeaderFiltersComponent } from './header-filters/header-filters.component';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../services/notification.service';
import { NotificationPanelComponent } from './notification-panel/notification-panel.component';
import { MatMenuModule } from '@angular/material/menu';
import { SafeImageComponent } from '../../../../../shared/components/safe-image/safe-image.component';
import { SYSTEM_CONST } from '../../../../constants/system.constant';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    ButtonComponent,
    HeaderFiltersComponent,
    NotificationPanelComponent,
    SafeImageComponent
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly genericDialog = inject(GenericDialogService);
  readonly authStore = inject(AuthStore);
  gridStore = inject(GridStateStore);
  private readonly router = inject(Router);
  readonly notificationService = inject(NotificationService);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly widgetService = inject(WidgetService);

  toggle = output<void>();
  pageTitle = input<string>('');
  sidebarExpanded = input<boolean>(true);


  readonly WIDGET_CONFIG_CONST = WIDGET_CONFIG_CONST;
  readonly HEADER_CONST = HEADER_CONST;
  readonly NOTIFICATION_CONFIG_CONST = NOTIFICATION_CONFIG_CONST;
  readonly SYSTEM_CONST = SYSTEM_CONST;

  logoutBtn = signal<CommonButtonConfig>(getButtonConfig(() => this.logout(), 'flat', 'primary', 'Logout'))

  readonly hasDashboardPermission = computed(() => {
    let targetDashboardUrl = '';
    let allWidgets: WidgetConfigItem<any>[] = [];
    
    if (this.authStore.isAdmin()) {
        targetDashboardUrl = 'admin/dashboard';
        allWidgets = AdminDashboardWidgets;
    } else if (this.authStore.isTeacher()) {
        targetDashboardUrl = 'teacher/dashboard';
        allWidgets = TeacherDashboardWidgets;
    } else if (this.authStore.isStudent()) {
        targetDashboardUrl = 'student/dashboard';
        allWidgets = StudentDashboardWidgets;
    } else {
        return false;
    }

    const canList = this.commonHelperService.getPermissionByPage(`/${targetDashboardUrl}`).canList;
    if (!canList) return false;

    const globalVis = this.widgetService.globalVisibility();
    if (globalVis) {
      return allWidgets.filter(w => globalVis[w.key as keyof DashboardWidgetsVisibility] !== false).length > 0;
    }
    
    return allWidgets.length > 0;
  });

  openWidgetConfiguration = (): void => {
    this.genericDialog.open({
      width: '600px',
      panelClass: 'widget-configuration-modal',
      title: WIDGET_CONFIG_CONST.CONFIGURE_WIDGETS,
      component: WidgetConfiguration,
    });
  }

  openNotificationConfiguration = (): void => {
    this.genericDialog.open({
      width: '750px',
      panelClass: 'notification-configuration-modal',
      title: NOTIFICATION_CONFIG_CONST.TITLE,
      component: NotificationConfiguration,
    });
  }

  openMyProfile = (): void => {
    if (this.authStore.isStudent() || this.authStore.isTeacher()) {
      this.router.navigate([this.authStore.usertype().toLowerCase(), 'profile']);
    }
  }

  openChangePassword = (): void => {
    this.genericDialog.open({
      width: '450px',
      panelClass: 'change-password-modal',
      title: LOGIN_CONST.CHANGE_PASSWORD,
      component: ChangePassword,
    });
  }

  logout = (): void => {
    const dialogRef = this.genericDialog.open({
      width: '400px',
      panelClass: 'custom-modal-wrap',
      disableClose: true,
      title: 'Logout',
      component: Logout,
      actions: [
        {
          ...getButtonConfig(() => { }, 'stroked', 'basic', LOGIN_CONST.CANCEL),
          result: false,
        },
        {
          ...getButtonConfig(() => { }, 'flat', 'primary', LOGIN_CONST.LOGOUT, true),
          result: true,
        },
      ],
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.gridStore.resetAll();
        this.authStore.logout();
      }
    });
  }
}


import { inject, computed, OnInit, Component, signal, effect, untracked } from '@angular/core';
import { AuthStore } from '../../../core/store/auth.store';
import { attendenceStatusStore } from '../../../features/admin/configuration/attendence-status/models/attendence-status';
import { DASHBOARD_SHARED_CONSTANTS } from '../../../core/constants/system.constant';
import { API } from '../../constants/api-url';
import { IDashboardEventsConfig } from './events/dashboard-events';
import { IDashboardNoticesConfig } from './notices/dashboard-notices';
import { IDashboardBirthdaysConfig } from './birthdays/dashboard-birthdays';
import { WidgetService } from '../../../core/services/widget.service';
import { AdminDashboardWidgets, StudentDashboardWidgets, TeacherDashboardWidgets, DashboardWidgetsVisibility, WidgetConfigItem } from './widget-configuration/model/widget-configuration.model';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IDashboardHolidaysConfig } from './holidays/dashboard-holidays';
import { CommonButtonConfig } from '../button/model/button.model';
import CommonHelper from '../../../core/helpers/common-helper';
import { ConfirmationService } from '../../services/dialog.service';
import { CommonHelperService } from '../../../core/services/common-helper.service';

@UntilDestroy()
@Component({
  template: ''
})
export abstract class BaseDashboard implements OnInit {
  protected readonly auth = inject(AuthStore);
  protected readonly attendenceStatusStore = inject(attendenceStatusStore);
  protected readonly widgetService = inject(WidgetService);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly commonHelperService = inject(CommonHelperService);

  readonly constants = DASHBOARD_SHARED_CONSTANTS;
  readonly API = API;

  readonly userRole = computed(() => (this.auth.roleRoutePath() as string)?.toLowerCase() || 'admin');
  readonly attendanceStatuses = this.attendenceStatusStore.list;
  readonly visibility = this.widgetService.visibility;
  
  readonly hasGlobalPermission = computed(() => {
    let allWidgets: WidgetConfigItem<any>[] = [];
    if (this.auth.isAdmin()) {
      allWidgets = AdminDashboardWidgets;
    } else if (this.auth.isTeacher()) {
      allWidgets = TeacherDashboardWidgets;
    } else if (this.auth.isStudent()) {
      allWidgets = StudentDashboardWidgets;
    }

    const globalVis = this.widgetService.globalVisibility();
    if (globalVis) {
      return allWidgets.filter(w => globalVis[w.key as keyof DashboardWidgetsVisibility] !== false).length > 0;
    }
    return allWidgets.length > 0;
  });

  readonly hasPermission = computed(() => {
    return this.commonHelperService.getPermissionByPage().canList && this.hasGlobalPermission();
  });

  readonly dashboardColors = {
    timetableAccents: ['#ff6d1f', '#0096ef', '#00a534', '#e82828', '#9333ea', '#ca8a04'],
    kpiCardPrimary: '#1a9e8d',
  };

  readonly currentMonthYear = computed(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  // Dynamic routes based on user role
  readonly dashboardRoutes = computed(() => {
    const role = this.userRole();
    return {
      studentAttendance: this.auth.isAdmin()
        ? ['/admin', 'attendance', 'student-attendances']
        : ['/', role, 'attendance', 'take-student-attendance'],
      teacherAttendance: ['/admin', 'attendance', 'teacher-attendances'],
      myAttendance: ['/', role, 'attendance'],
      timetable: ['/', role, 'timetable'],
      exams: ['/', role, 'examination', 'exams'],
      homeworks: this.auth.isStudent()
        ? ['/', role, 'homeworks']
        : ['/', role, 'homework', 'reviews'],
    };
  });

  eventsConfig = signal<IDashboardEventsConfig>(null);
  noticesConfig = signal<IDashboardNoticesConfig>(null);
  holidaysConfig = signal<IDashboardHolidaysConfig>(null);
  birthdaysConfig = signal<IDashboardBirthdaysConfig>(null);

  readonly refreshButtonConfig = computed<CommonButtonConfig>(() => (CommonHelper.getRefreshButtonConfig(
    () => this.refreshDashboardData(true)
  )));

  constructor() {
    effect(() => {
      if (this.visibility()) {
        untracked(() => this.refreshDashboardData());
      }
    })
  }

  ngOnInit(): void {
    this.widgetService.loadWidgetSettings();
  }

  checkWidgetVisibility = (widgetKeySuffix: string): boolean => {
    const role = this.userRole();
    const visibility = this.visibility();
    if (!visibility) return false;
    return !!visibility[`${role}${widgetKeySuffix}` as keyof DashboardWidgetsVisibility];
  }

  refreshDashboardData = (forceReload: boolean = false): void => {
    if (forceReload) {
      this.eventsConfig.set(null);
      this.noticesConfig.set(null);
      this.holidaysConfig.set(null);
      this.birthdaysConfig.set(null);
    }

    setTimeout(() => {
      this.setupSharedWidgetConfigs();
      this.loadDashboardData();
    }, 0);
  }

  private setupSharedWidgetConfigs = (): void => {
    const role = this.userRole();

    // 1. Events Config
    this.eventsConfig.set(
      this.checkWidgetVisibility('Events')
        ? { onHide: () => this.toggleVisibility(`${role}Events` as keyof DashboardWidgetsVisibility) }
        : null
    );

    // 2. Notices Config
    this.noticesConfig.set(
      this.checkWidgetVisibility('Notices')
        ? { onHide: () => this.toggleVisibility(`${role}Notices` as keyof DashboardWidgetsVisibility) }
        : null
    );

    // 3. Holidays Config
    this.holidaysConfig.set(
      this.checkWidgetVisibility('Holiday')
        ? { onHide: () => this.toggleVisibility(`${role}Holiday` as keyof DashboardWidgetsVisibility) }
        : null
    );

    // 4. Birthdays Config
    if (this.checkWidgetVisibility('Birthdays')) {
      this.birthdaysConfig.set({
        onHide: () => this.toggleVisibility(`${role}Birthdays` as keyof DashboardWidgetsVisibility)
      });
    } else {
      this.birthdaysConfig.set(null);
    }
  }

  abstract loadDashboardData(): void;

  toggleVisibility = (section: keyof DashboardWidgetsVisibility): void => {
    const currentVal = this.widgetService.getWidgetState(section);
    if (currentVal) {
      this.confirmationService.confirm({
        title: this.constants.CONFIRM_HIDE.TITLE,
        message: this.constants.CONFIRM_HIDE.MESSAGE,
        confirmText: this.constants.CONFIRM_HIDE.CONFIRM_TEXT,
        cancelText: this.constants.CONFIRM_HIDE.CANCEL_TEXT
      }).subscribe(confirmed => {
        if (confirmed) {
          this.widgetService.updateWidgetVisibility(section, false);
        }
      });
    } else {
      this.widgetService.updateWidgetVisibility(section, true);
    }
  }
}

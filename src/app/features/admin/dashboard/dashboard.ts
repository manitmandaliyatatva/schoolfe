import { ChangeDetectionStrategy, Component, inject, OnInit, computed, effect, untracked } from '@angular/core';
import { DashboardStackedBarChart } from '../../../shared/components/dashboard/charts/stacked-bar-chart/stacked-bar-chart';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardCard } from '../../../shared/components/dashboard/card/dashboard-card';
import { DashboardSection } from '../../../shared/components/dashboard/section/dashboard-section';
import { DashboardListItem } from '../../../shared/components/dashboard/list-item/dashboard-list-item';
import { CommonModule } from '@angular/common';
import { DashboardKPIStore, DashboardAttendanceStore, DashboardExamStore, DashboardAdminSummaryStore } from './models/dashboard.model';
import { DashboardEvents } from '../../../shared/components/dashboard/events/dashboard-events';
import { DashboardNotices } from '../../../shared/components/dashboard/notices/dashboard-notices';
import { DashboardBirthdays } from '../../../shared/components/dashboard/birthdays/dashboard-birthdays';
import { DashboardHolidays } from '../../../shared/components/dashboard/holidays/dashboard-holidays';
import CommonHelper from '../../../core/helpers/common-helper';
import { DashboardHelper } from '../../../core/helpers/dashboard-helper';
import { BaseDashboard } from '../../../shared/components/dashboard/base-dashboard';
import { IDashboardSectionConfig } from '../../../shared/components/dashboard/section/dashboard-section';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DashboardEmptyState } from '../../../shared/components/dashboard/empty-state/dashboard-empty-state';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    DashboardCard,
    DashboardSection,
    DashboardListItem,
    DashboardEvents,
    DashboardNotices,
    DashboardBirthdays,
    DashboardHolidays,
    DashboardStackedBarChart,
    ButtonComponent,
    DashboardEmptyState
  ],
  templateUrl: './dashboard.html',
  styleUrls: [
    '../../../shared/styles/dashboard-shared.scss',
    './dashboard.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard extends BaseDashboard implements OnInit {

  private readonly kpiStore = inject(DashboardKPIStore);
  private readonly attendanceStore = inject(DashboardAttendanceStore);
  private readonly examStore = inject(DashboardExamStore);
  private readonly summaryStore = inject(DashboardAdminSummaryStore);

  constructor() {
    super();
    effect(() => {
      const summary = this.summaryStore.data();
      if (summary) {
        untracked(() => {
          this.kpiStore.setData(summary.kpiCount);
          this.attendanceStore.setData(summary.attendanceSummary);
          this.examStore.setList(summary.upcomingExams?.data || []);

          if (this.eventsConfig()) {
            this.eventsConfig.update(c => ({ ...c, data: summary.events?.data || [] }));
          }
          if (this.noticesConfig()) {
            this.noticesConfig.update(c => ({ ...c, data: summary.notices }));
          }
          if (this.birthdaysConfig()) {
            this.birthdaysConfig.update(c => ({ ...c, data: summary.birthdaySummary || [] }));
          }
          if (this.holidaysConfig()) {
            this.holidaysConfig.update(c => ({ ...c, data: summary.holidays?.data || [] }));
          }
          if (summary.attendanceStatusList) {
            this.attendenceStatusStore.setList(summary.attendanceStatusList?.data || []);
          }
        });
      }
    });
  }

  kpiData = this.kpiStore.data;

  stats = computed(() => {
    const data = this.kpiData();
    const kpi = this.constants.KPI;
    return [
      { label: kpi.TOTAL_STUDENTS, value: data?.totalStudents ?? 0, color: this.dashboardColors.kpiCardPrimary, icon: 'groups', variant: 'stats' as const },
      { label: kpi.TOTAL_TEACHERS, value: data?.totalTeachers ?? 0, color: this.dashboardColors.kpiCardPrimary, icon: 'person', variant: 'stats' as const },
      { label: kpi.TOTAL_SECTIONS, value: data?.totalSections ?? 0, color: this.dashboardColors.kpiCardPrimary, icon: 'class', variant: 'stats' as const },
      { label: kpi.TOTAL_FEES_COLLECTED, value: `$${data?.totalCollectedFees?.toLocaleString() ?? 0}`, color: this.dashboardColors.kpiCardPrimary, icon: 'account_balance_wallet', variant: 'stats' as const },
      { label: kpi.TOTAL_PENDING_FEES, value: `$${data?.totalPendingFees?.toLocaleString() ?? 0}`, color: this.dashboardColors.kpiCardPrimary, icon: 'payments', variant: 'stats' as const },
    ];
  });

  studentAttendanceChart = computed(() => {
    const data = this.attendanceStore.data();
    const counts = data?.studentAttendanceSummary;
    return DashboardHelper.prepareAttendanceChart(counts, counts?.totalStudents || 0, this.attendanceStatuses(), true);
  });

  teacherAttendanceChart = computed(() => {
    const data = this.attendanceStore.data();
    const counts = data?.teacherAttendanceSummary;
    return DashboardHelper.prepareAttendanceChart(counts, counts?.totalTeachers || 0, this.attendanceStatuses(), true);
  });

  studentAttendanceSectionConfig = computed<IDashboardSectionConfig>(() => ({
    title: this.constants.TITLES.STUDENT_ATTENDANCE,
    viewAllLink: this.dashboardRoutes().studentAttendance,
    onHide: () => this.toggleVisibility('adminStudentAttendance')
  }));

  teacherAttendanceSectionConfig = computed<IDashboardSectionConfig>(() => ({
    title: this.constants.TITLES.TEACHER_ATTENDANCE,
    viewAllLink: this.dashboardRoutes().teacherAttendance,
    onHide: () => this.toggleVisibility('adminTeacherAttendance')
  }));

  examsSectionConfig = computed<IDashboardSectionConfig>(() => ({
    title: this.constants.TITLES.EXAMS,
    viewAllLink: this.dashboardRoutes().exams,
    isEmpty: this.upcomingExams().length === 0,
    emptyMessage: this.constants.EMPTY_STATES.EXAMS,
    emptyIcon: 'assignment',
    onHide: () => this.toggleVisibility('adminExams')
  }));

  override loadDashboardData = () => {
    const activeSections = this.visibility();
    if (!activeSections) return;

    this.summaryStore.getById({
      endpoint: this.API.ADMIN.DASHBOARD.GET_SUMMARY
    });
  }

  upcomingExams = computed(() => {
    const list = this.examStore.list();
    return list.map(item => {
      const duration = CommonHelper.calculateDuration(item.startTime, item.endTime);
      const displayTime = CommonHelper.formatTimeAMPM(item.startTime);
      return {
        date: item.examDate,
        title: item.examName,
        subtitle: `${item.classSectionName} • ${displayTime}${duration ? ` (${duration})` : ''} • ${item.examTypeName}`,
        footer: `${this.constants.LABELS.PASS}: ${item.passingMarks} / ${this.constants.LABELS.MAX}: ${item.maxMarks}`
      };
    });
  });
}


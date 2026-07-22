import { ChangeDetectionStrategy, Component, inject, OnInit, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardSection } from '../../../shared/components/dashboard/section/dashboard-section';
import { DashboardEvents } from '../../../shared/components/dashboard/events/dashboard-events';
import { DashboardNotices } from '../../../shared/components/dashboard/notices/dashboard-notices';
import { DashboardTable } from '../../../shared/components/dashboard/table/dashboard-table';
import { DashboardListItem, IDashboardListItem } from '../../../shared/components/dashboard/list-item/dashboard-list-item';
import { DashboardDonutChart } from '../../../shared/components/dashboard/charts/donut-chart/donut-chart';
import { DashboardBirthdays } from '../../../shared/components/dashboard/birthdays/dashboard-birthdays';
import { DashboardHolidays } from '../../../shared/components/dashboard/holidays/dashboard-holidays';
import { IDashboardTableConfig } from '../../../shared/components/dashboard/table/model/dashboard-table.model';
import {
  StudentAttendanceStore,
  StudentTimetableStore,
  StudentExamStore,
  StudentHomeworkStore,
  DashboardStudentSummaryStore
} from './models/student-dashboard.model';
import { buildGridListRequest } from '../../../shared/helpers/grid.helper';
import CommonHelper from '../../../core/helpers/common-helper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BaseDashboard } from '../../../shared/components/dashboard/base-dashboard';
import { IDashboardSectionConfig } from '../../../shared/components/dashboard/section/dashboard-section';
import { DashboardHelper } from '../../../core/helpers/dashboard-helper';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DashboardEmptyState } from '../../../shared/components/dashboard/empty-state/dashboard-empty-state';

@UntilDestroy()
@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardSection,
    DashboardEvents,
    DashboardNotices,
    DashboardTable,
    DashboardListItem,
    DashboardDonutChart,
    DashboardBirthdays,
    DashboardHolidays,
    ButtonComponent,
    DashboardEmptyState
  ],
  templateUrl: './student-dashboard.html',
  styleUrl: '../../../shared/styles/dashboard-shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboard extends BaseDashboard implements OnInit {
  private readonly attendanceStore = inject(StudentAttendanceStore);
  private readonly timetableStore = inject(StudentTimetableStore);
  public readonly examStore = inject(StudentExamStore);
  public readonly homeworkStore = inject(StudentHomeworkStore);
  private readonly summaryStore = inject(DashboardStudentSummaryStore);

  constructor() {
    super();
    effect(() => {
      const summary = this.summaryStore.data();
      if (summary) {
        untracked(() => {
          this.attendanceStore.setData(summary.attendanceSummary);
          this.examStore.setList(summary.upcomingExams?.data || []);
          this.homeworkStore.setList(summary.recentHomeworkList?.data || []);
          this.timetableStore.setList(summary.timeTableSummary || []);

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

  readonly myAttendanceChart = computed(() => {
    const data = this.attendanceStore.data();
    // For student, totalStudents in data might represent total days in month
    const totalDays = data?.totalStudents || 0;
    const result = DashboardHelper.prepareAttendanceChart(data, totalDays, this.attendanceStatuses(), false);
    return {
      series: result.data.map(d => d.value),
      labels: result.data.map(d => d.label),
      colors: result.colors
    };
  });

  attendanceSectionConfig = computed<IDashboardSectionConfig>(() => ({
    title: this.constants.TITLES.MY_ATTENDANCE + ' (' + this.currentMonthYear() + ')',
    viewAllLink: this.dashboardRoutes().myAttendance,
    onHide: () => this.toggleVisibility('studentAttendance')
  }));

  timetableSectionConfig = computed<IDashboardSectionConfig>(() => ({
    title: this.constants.TITLES.TIMETABLE,
    viewAllLink: this.dashboardRoutes().timetable,
    isEmpty: this.todayTimetable().length === 0,
    emptyMessage: this.constants.EMPTY_STATES.TIMETABLE,
    emptyIcon: 'schedule',
    onHide: () => this.toggleVisibility('studentTimetable')
  }));

  homeworksSectionConfig = computed<IDashboardSectionConfig>(() => ({
    title: this.constants.TITLES.MY_RECENT_HOMEWORKS,
    viewAllLink: this.dashboardRoutes().homeworks,
    isEmpty: this.homeworkStore.list().length === 0,
    emptyMessage: this.constants.EMPTY_STATES.MY_RECENT_HOMEWORKS,
    emptyIcon: 'menu_book',
    onHide: () => this.toggleVisibility('studentHomeworks')
  }));

  examsSectionConfig = computed<IDashboardSectionConfig>(() => ({
    title: this.constants.TITLES.MY_RECENT_EXAMS,
    viewAllLink: this.dashboardRoutes().exams,
    isEmpty: this.examData().length === 0,
    emptyMessage: this.constants.EMPTY_STATES.MY_RECENT_EXAMS,
    emptyIcon: 'assignment',
    onHide: () => this.toggleVisibility('studentExams')
  }));

  // Table Configurations
  readonly examConfig: IDashboardTableConfig = {
    columns: [
      { header: this.constants.TABLE_HEADERS.EXAM, key: 'examName', class: 'fw-medium text-dark' },
      { header: this.constants.TABLE_HEADERS.SUBJECT, key: 'subjectName' },
      { header: this.constants.TABLE_HEADERS.DATE, key: 'examDate', type: 'date' },
      { header: this.constants.TABLE_HEADERS.MARKS, key: 'marksDisplay' },
      { header: this.constants.TABLE_HEADERS.GRADE, key: 'grade' },
      { header: this.constants.TABLE_HEADERS.RESULT, key: 'result' },
      {
        header: this.constants.TABLE_HEADERS.STATUS, key: 'status', type: 'badge',
        badgeClass: (val) => val === this.constants.LABELS.COMPLETED ? 'bg-info' : 'bg-warning'
      },
    ]
  };

  readonly homeworkConfig: IDashboardTableConfig = {
    columns: [
      { header: this.constants.TABLE_HEADERS.TITLE, key: 'title', class: 'fw-medium text-dark' },
      { header: this.constants.TABLE_HEADERS.SUBJECT, key: 'subjectName' },
      { header: this.constants.TABLE_HEADERS.DUE_DATE, key: 'dueDate', type: 'date' },
      { header: this.constants.TABLE_HEADERS.SUBMITTED, key: 'submitted', type: 'boolean' },
      { header: this.constants.TABLE_HEADERS.REVIEWED, key: 'reviewed', type: 'boolean' },
    ]
  };

  readonly todayTimetable = computed<IDashboardListItem[]>(() => {
    return this.timetableStore.list().map((item, index) => ({
      title: item.isBreak ? this.constants.LABELS.BREAK : item.subjectName,
      startTime: CommonHelper.formatTimeAMPM(item.startTime),
      endTime: CommonHelper.formatTimeAMPM(item.endTime),
      subtitle: item.isBreak ? '' : item.teacherName,
      location: item.isBreak ? '' : String(item.roomNo || ''),
      locationIcon: 'meeting_room',
      accentColor: item.isBreak ? '#94a3b8' : this.dashboardColors.timetableAccents[index % this.dashboardColors.timetableAccents.length]
    }));
  });

  readonly examData = computed(() => {
    return this.examStore.list().map(item => ({
      ...item,
      marksDisplay: item.obtainedMarks ? `${item.obtainedMarks} / ${item.maxMarks}` : `-`
    }));
  });

  override loadDashboardData = () => {
    const activeSections = this.visibility();
    if (!activeSections) return;

    this.summaryStore.getById({
      endpoint: this.API.STUDENT.DASHBOARD.GET_SUMMARY
    });
  }
}


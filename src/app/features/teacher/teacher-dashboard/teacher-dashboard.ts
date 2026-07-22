import { ChangeDetectionStrategy, Component, inject, OnInit, computed, effect, signal, untracked } from '@angular/core';
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
  TeacherAttendanceStore,
  StudentAttendanceStore,
  TodayTimetableStore,
  TeacherExamStore,
  TeacherHomeworkStore,
  DashboardTeacherSummaryStore
} from './models/teacher-dashboard.model';
import { buildGridListRequest } from '../../../shared/helpers/grid.helper';
import CommonHelper from '../../../core/helpers/common-helper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BaseDashboard } from '../../../shared/components/dashboard/base-dashboard';
import { IDashboardSectionConfig } from '../../../shared/components/dashboard/section/dashboard-section';
import { DashboardHelper } from '../../../core/helpers/dashboard-helper';
import { CommonDropdownStore } from '../../../core/store/common-dropdown.store';
import { getDropdownConfig } from '../../../shared/functions/config-function';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonDropdownComponent } from '../../../shared/components/common-dropdown/common-dropdown.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonDropdownConfig } from '../../../shared/components/common-dropdown/model/common-dropdown.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CommonHelperService } from '../../../core/services/common-helper.service';
import { DashboardEmptyState } from '../../../shared/components/dashboard/empty-state/dashboard-empty-state';

@UntilDestroy()
@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DashboardSection,
    DashboardEvents,
    DashboardNotices,
    DashboardTable,
    DashboardListItem,
    DashboardDonutChart,
    DashboardBirthdays,
    DashboardHolidays,
    CommonDropdownComponent,
    ButtonComponent,
    DashboardEmptyState
  ],
  templateUrl: './teacher-dashboard.html',
  styleUrls: [
    '../../../shared/styles/dashboard-shared.scss',
    './teacher-dashboard.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherDashboard extends BaseDashboard implements OnInit {
  private readonly attendanceStore = inject(TeacherAttendanceStore);
  private readonly studentAttendanceStore = inject(StudentAttendanceStore);
  private readonly timetableStore = inject(TodayTimetableStore);
  public readonly examStore = inject(TeacherExamStore);
  public readonly homeworkStore = inject(TeacherHomeworkStore);
  private readonly fb = inject(FormBuilder);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly summaryStore = inject(DashboardTeacherSummaryStore);

  // Selectors for effects to avoid unnecessary re-runs
  private readonly isStudentAttendanceVisible = computed(() => this.visibility()?.teacherStudentAttendance ?? false);

  // Filters & Dropdowns
  readonly classroomDropdownList = this.dropdownStore.getList('classSection');
  classSectionDropdown = signal<CommonDropdownConfig>({
    ...getDropdownConfig('classSection', '', []),
    isFloatLabel: false
  });

  filterForm = this.fb.group({
    classSection: this.fb.control<string | null>(null),
  });

  // Convert form value to signal for reactive tracking
  classSectionId = toSignal(this.filterForm.controls.classSection.valueChanges);

  readonly myAttendanceChart = computed(() => {
    const data = this.attendanceStore.data();
    const result = DashboardHelper.prepareAttendanceChart(data, data?.totalTeachers || 0, this.attendanceStatuses(), false);
    return {
      series: result.data.map(d => d.value),
      labels: result.data.map(d => d.label),
      colors: result.colors
    };
  });

  readonly studentAttendanceChart = computed(() => {
    const data = this.studentAttendanceStore.data();
    const result = DashboardHelper.prepareAttendanceChart(data, data?.totalStudents || 0, this.attendanceStatuses(), true);
    return {
      series: result.data.map(d => d.value),
      labels: result.data.map(d => d.label),
      colors: result.colors
    };
  });

  teacherAttendanceSectionConfig = computed<IDashboardSectionConfig>(() => ({
    title: this.constants.TITLES.MY_ATTENDANCE + ' (' + this.currentMonthYear() + ')',
    onHide: () => this.toggleVisibility('teacherAttendance')
  }));

  studentAttendanceSectionConfig = computed<IDashboardSectionConfig>(() => ({
    title: this.constants.TITLES.STUDENTS_TODAY_ATTENDANCE,
    viewAllLink: this.dashboardRoutes().studentAttendance,
    state: { classSectionId: this.classSectionId() },
    onHide: () => this.toggleVisibility('teacherStudentAttendance')
  }));

  timetableSectionConfig = computed<IDashboardSectionConfig>(() => ({
    title: this.constants.TITLES.TIMETABLE,
    viewAllLink: this.dashboardRoutes().timetable,
    isEmpty: this.todayTimetable().length === 0,
    emptyMessage: this.constants.EMPTY_STATES.TIMETABLE,
    emptyIcon: 'schedule',
    onHide: () => this.toggleVisibility('teacherTimetable')
  }));

  examsSectionConfig = computed<IDashboardSectionConfig>(() => ({
    title: this.constants.TITLES.MY_RECENT_EXAMS,
    viewAllLink: this.dashboardRoutes().exams,
    isEmpty: this.examStore.list().length === 0,
    emptyMessage: this.constants.EMPTY_STATES.MY_RECENT_EXAMS,
    emptyIcon: 'assignment',
    onHide: () => this.toggleVisibility('teacherExams')
  }));

  homeworksSectionConfig = computed<IDashboardSectionConfig>(() => ({
    title: this.constants.TITLES.MY_RECENT_HOMEWORKS,
    viewAllLink: this.dashboardRoutes().homeworks,
    isEmpty: this.homeworkStore.list().length === 0,
    emptyMessage: this.constants.EMPTY_STATES.MY_RECENT_HOMEWORKS,
    emptyIcon: 'menu_book',
    onHide: () => this.toggleVisibility('teacherHomeworks')
  }));

  // Table Configurations
  readonly examConfig: IDashboardTableConfig = {
    columns: [
      { header: this.constants.TABLE_HEADERS.EXAM, key: 'examName', class: 'fw-medium text-dark' },
      {
        header: this.constants.TABLE_HEADERS.CLASSROOMS,
        key: 'classSectionName',
        formatter: (value: string) => CommonHelper.getClassroomDisplay(value)
      },
      { header: this.constants.TABLE_HEADERS.SUBJECT, key: 'subjectName' },
      { header: this.constants.TABLE_HEADERS.MARKS_ENTRY, key: 'progress', type: 'progress', valueKey: 'totalMarkEntry', totalKey: 'totalStudents' },
    ]
  };

  readonly homeworkConfig: IDashboardTableConfig = {
    columns: [
      { header: this.constants.TABLE_HEADERS.HOMEWORK, key: 'title', class: 'fw-medium text-dark' },
      { header: this.constants.TABLE_HEADERS.CLASS, key: 'classSectionName' },
      { header: this.constants.TABLE_HEADERS.SUBJECT, key: 'subjectName' },
      {
        header: this.constants.TABLE_HEADERS.REVIEWED,
        key: 'progress',
        type: 'progress',
        valueKey: 'totalReviewed',
        totalKey: 'totalSubmitted',
        showInfo: true,
        infoKeys: [
          { label: this.constants.LABELS.TOTAL_STUDENTS, key: 'totalStudent' },
          { label: this.constants.LABELS.TOTAL_SUBMITTED, key: 'totalSubmitted' },
          { label: this.constants.LABELS.TOTAL_REVIEWED, key: 'totalReviewed' }
        ]
      },
    ]
  };

  readonly todayTimetable = computed<IDashboardListItem[]>(() => {
    if (!this.visibility()?.teacherTimetable) return [];
    return this.timetableStore.list().map((item, index) => ({
      title: item.subjectName,
      startTime: CommonHelper.formatTimeAMPM(item.startTime),
      endTime: CommonHelper.formatTimeAMPM(item.endTime),
      badge: item.classSectionName,
      location: String(item.roomNo || ''),
      locationIcon: 'meeting_room',
      accentColor: this.dashboardColors.timetableAccents[index % this.dashboardColors.timetableAccents.length]
    }));
  });

  constructor() {
    super();
    this.initializeEffects();

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

  private initializeEffects = () => {
    // 1. Sync dropdown options from store
    effect(() => {
      const options = this.classroomDropdownList();
      this.classSectionDropdown.update(config => ({ ...config, data: options }));

      // Set default value if not set
      if (options.length > 0 && !this.filterForm.controls.classSection.value) {
        this.filterForm.controls.classSection.setValue(String(options[0].value));
      }
    });

    // 2. Reactive Student Attendance: Reload when class section changes or visibility toggled
    effect(() => {
      const id = this.classSectionId();
      if (this.isStudentAttendanceVisible() && id) {
        this.loadStudentAttendanceData(String(id));
      }
    });
  }

  override loadDashboardData = () => {
    const activeSections = this.visibility();
    if (!activeSections) return;

    this.summaryStore.getById({
      endpoint: this.API.TEACHER.DASHBOARD.GET_SUMMARY
    });

    if (activeSections.teacherStudentAttendance) {
      this.dropdownStore.getDropdown<any>({
        key: 'classSection',
        endpoint: this.API.ADMIN.CONFIGURATION.CLASSROOM.DROPDOWN,
        params: { timetableSection: true }
      });
    }
  }

  private loadStudentAttendanceData = (classSectionId: string): void => {
    this.studentAttendanceStore.getById({
      endpoint: this.API.TEACHER.DASHBOARD.STUDENT_ATTENDANCE,
      params: { classSectionId }
    });
  }

}


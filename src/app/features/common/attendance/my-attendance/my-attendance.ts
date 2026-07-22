import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, OnDestroy, OnInit, signal, untracked } from "@angular/core";
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { NgApexchartsModule } from "ng-apexcharts";
import { getFullMonth } from "../../../../core/constants/system.constant";
import CommonHelper from "../../../../core/helpers/common-helper";
import { MaterialModule } from "../../../../core/modules/material/material.module";
import { AcademicYearHelperService } from "../../../../core/services/academic-year-helper.service";
import { CommonHelperService } from "../../../../core/services/common-helper.service";
import { GlobalRefreshService } from "../../../../core/services/global-refresh.service";
import { HolidayHelperService } from "../../../../core/services/holiday-helper.service";
import { API as API_URL } from '../../../../shared/constants/api-url';
import { AttendanceStatus } from "../../../../shared/Enums/attendance-status.enum";
import { buildGridListRequest } from "../../../../shared/helpers/grid.helper";
import { attendenceStatusStore, IAttendenceStatus } from "../../../admin/configuration/attendence-status/models/attendence-status";
import { monthlyAttendanceStore } from "../../../teacher/attendance/attendance.model";
import { IAttendanceStatusListRequest, ICalendarCell, IDynamicStat } from "./models/my-attendance.model";

@UntilDestroy()
@Component({
  selector: 'app-my-attendance',
  standalone: true,
  imports: [CommonModule, MaterialModule, NgApexchartsModule],
  templateUrl: './my-attendance.html',
  styleUrls: ['./my-attendance.scss']
})
export class MyAttendance implements OnInit, OnDestroy {
  currentMonth = signal<number>(new Date().getMonth() + 1);
  currentYear = signal<number>(new Date().getFullYear());

  readonly listStore = inject(monthlyAttendanceStore);
  readonly attendanceStatusStore = inject(attendenceStatusStore);
  private readonly holidayHelperService = inject(HolidayHelperService);
  private readonly globalRefreshService = inject(GlobalRefreshService);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly router = inject(Router);

  readonly mode = computed<'student' | 'teacher'>(() => {
    return this.router.url.includes('/teacher') ? 'teacher' : 'student';
  });

  readonly permission = computed(() => this.commonHelperService.getPermissionByPage());

  readonly calendarMinDate = computed(() => this.academicYearHelper.getAcademicYearStartDate());
  readonly calendarMaxDate = computed(() => this.academicYearHelper.getDatepickerMaxDate());
  readonly viewDate = computed(() => new Date(this.currentYear(), this.currentMonth() - 1, 1));

  setMonthAndYear = (normalizedMonthAndYear: Date, datepicker: any) => {
    const m = normalizedMonthAndYear.getMonth() + 1;
    const y = normalizedMonthAndYear.getFullYear();
    this.currentMonth.set(m);
    this.currentYear.set(y);
    datepicker.close();
    this.loadAttendanceDetails(m, y);
  };

  months = getFullMonth;
  weekDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  // Dynamic Stats
  dynamicStats = signal<IDynamicStat[]>([]);
  calendarLegends = signal<{ name: string, color: string }[]>([]);

  holidayCount = 0;
  weekOffCount = 0;
  pendingCount = signal(0);
  workingDays = 0;
  daysInMonth = signal(0);
  pendingPercentage = signal(0);

  // Calendar
  calendarCells = signal<ICalendarCell[]>([]);

  monthName = computed(() => {
    const m = this.currentMonth();
    return this.months.find(x => x.value === m)?.text || '';
  });

  selectedYear = computed(() => this.currentYear());

  disablePreviousMonth = computed(() => {
    const minDate = this.academicYearHelper.getAcademicYearStartDate();
    if (!minDate) return false;
    const currentMonth = this.currentMonth() - 1;
    const currentYear = this.currentYear();
    return currentYear < minDate.getFullYear() ||
      (currentYear === minDate.getFullYear() && currentMonth <= minDate.getMonth());
  });

  disableNextMonth = computed(() => {
    const maxDate = this.academicYearHelper.getDatepickerMaxDate();
    if (!maxDate) return false;
    const currentMonth = this.currentMonth() - 1;
    const currentYear = this.currentYear();
    return currentYear > maxDate.getFullYear() ||
      (currentYear === maxDate.getFullYear() && currentMonth >= maxDate.getMonth());
  });

  previousMonth(): void {
    let m = this.currentMonth() - 1;
    let y = this.currentYear();
    if (m < 1) {
      m = 12;
      y--;
    }
    this.currentMonth.set(m);
    this.currentYear.set(y);
    this.loadAttendanceDetails(m, y);
  }

  nextMonth(): void {
    let m = this.currentMonth() + 1;
    let y = this.currentYear();
    if (m > 12) {
      m = 1;
      y++;
    }
    this.currentMonth.set(m);
    this.currentYear.set(y);
    this.loadAttendanceDetails(m, y);
  }

  constructor() {
    effect(() => {
      const isSuccess = this.listStore.isSuccess();
      const raw = this.listStore.list() as any;
      const statusList = this.attendanceStatusStore.list();
      this.holidayHelperService.list();
      if (isSuccess) {
        untracked(() => {
          const reportObj = Array.isArray(raw) ? raw[0] : raw;
          this.processAttendanceData(reportObj, statusList);
        });
      }
    });
  }

  ngOnInit(): void {
    if (!this.permission().canList) return;
    const body: IAttendanceStatusListRequest = {
      ...buildGridListRequest<IAttendenceStatus>(null),
      isFromAttendanceStatus: true
    };
    this.attendanceStatusStore.getAll({
      endpoint: API_URL.ADMIN.CONFIGURATION.ATTENDENCE_STATUS.LIST,
      body: body as any
    });
    this.loadAttendanceDetails(this.currentMonth(), this.currentYear());

    this.globalRefreshService.globalRefreshObservable.pipe(
      untilDestroyed(this)
    ).subscribe(() => {
      const minDate = this.academicYearHelper.getAcademicYearStartDate();
      const maxDate = this.academicYearHelper.getDatepickerMaxDate();
      const currentViewDate = new Date(this.currentYear(), this.currentMonth() - 1, 1);

      if (minDate && maxDate && (currentViewDate < minDate || currentViewDate > maxDate)) {
        const today = new Date();
        if (today >= minDate && today <= maxDate) {
          this.currentYear.set(today.getFullYear());
          this.currentMonth.set(today.getMonth() + 1);
        } else {
          this.currentYear.set(minDate.getFullYear());
          this.currentMonth.set(minDate.getMonth() + 1);
        }
      }

      this.loadAttendanceDetails(this.currentMonth(), this.currentYear());
    });
  }

  ngOnDestroy(): void {
    this.holidayHelperService.clearHolidays();
    this.listStore.resetState();
    this.attendanceStatusStore.resetState();
  }

  loadAttendanceDetails = (month: number, year: number): void => {
    if (!this.permission().canList) return;
    this.listStore.getAll({
      endpoint: this.mode() === 'teacher' ? API_URL.TEACHER.ATTENDANCE.DETAILS : API_URL.STUDENT.ATTENDANCE.DETAILS,
      params: { month, year }
    });

    const startDate = CommonHelper.toDateOnly(new Date(year, month - 1, 1));
    const endDate = CommonHelper.toDateOnly(new Date(year, month, 0));

    this.holidayHelperService.loadHolidays({
      startDate,
      endDate
    }).pipe(untilDestroyed(this)).subscribe();
  }

  processAttendanceData = (reportObj: any, statusList: IAttendenceStatus[]): void => {
    // Reset
    this.holidayCount = 0;

    const year = this.currentYear();
    const month = this.currentMonth() - 1;
    this.daysInMonth.set(new Date(year, month + 1, 0).getDate());

    let dailyAttendances: any[] = [];

    // Try extracting from API response
    const studentAttendances = reportObj?.studentAttendances;
    const teacherAttendances = reportObj?.teacherAttendances;
    if (studentAttendances && studentAttendances.length > 0) {
      const student = studentAttendances[0];
      dailyAttendances = student.dailyAttendances || [];
    } else if (teacherAttendances && teacherAttendances.length > 0) {
      const teacher = teacherAttendances[0];
      dailyAttendances = teacher.dailyAttendances || [];
    }

    this.buildCalendarGrid(year, month, dailyAttendances, statusList);
    this.calculateKPIs(statusList);
  }

  buildCalendarGrid = (year: number, month: number, dailyAttendances: any[], statusList: IAttendenceStatus[]): void => {
    const firstDay = new Date(year, month, 1).getDay();
    const weeklyOffs = this.holidayHelperService.weeklyOffs();
    const cells: ICalendarCell[] = [];

    // Padding cells
    for (let i = 0; i < firstDay; i++) {
      cells.push({ isEmpty: true });
    }

    for (let day = 1; day <= this.daysInMonth(); day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const weekNum = Math.ceil(date.getDate() / 7);

      const statusObj = this.holidayHelperService.checkHolidayStatus(date);
      const isConfiguredWeekOff = weeklyOffs.some((item: any) =>
        item.weekDay === dayOfWeek &&
        (item.weekNumber?.includes(0) || item.weekNumber?.includes(weekNum))
      );
      const isHoliday = statusObj.isHoliday;
      const isWeekOff = statusObj.isWeekOff || isConfiguredWeekOff;

      let status = '';
      let statusColor = '';
      let bgTint = '';
      let remark = '';

      const dailyRecord = dailyAttendances.find((d: any) => d.day === day);

      if (dailyRecord && dailyRecord.statusCode) {
        status = dailyRecord.statusCode;
        const apiStatus = statusList?.find((s: any) => s.attendanceStatusCode === status);

        statusColor = dailyRecord.backgroundColorCode || apiStatus?.backgroundColorCode || '#000000';
        bgTint = dailyRecord.colorCode || apiStatus?.colorCode || 'transparent';
        remark = dailyRecord.remark || '';
      } else if (isHoliday) {
        status = AttendanceStatus.Holiday;
        const apiStatus = statusList?.find((s: any) => s.attendanceStatusCode === status);
        statusColor = apiStatus?.backgroundColorCode || '#7e22ce';
        bgTint = apiStatus?.colorCode || '#f5f0ff';
      } else if (isWeekOff) {
        status = AttendanceStatus.WeekOff;
        const apiStatus = statusList?.find((s: any) => s.attendanceStatusCode === status);
        statusColor = apiStatus?.colorCode || '#0284c7';
        bgTint = apiStatus?.backgroundColorCode || '#f0f9ff';
      } else {
        status = 'PD';
        const apiStatus = statusList?.find((s: any) => s.attendanceStatusCode === status);
        statusColor = apiStatus?.backgroundColorCode || '#9ca3af';
        bgTint = apiStatus?.colorCode || '#f3f4f6';
      }

      cells.push({
        isEmpty: false,
        date: day,
        isWeekend: isWeekOff,
        isHoliday,
        status,
        statusColor,
        bgTint,
        remark
      });
    }

    this.calendarCells.set(cells);
  }

  calculateKPIs = (statusList: IAttendenceStatus[]): void => {
    let pending = 0;
    this.holidayCount = 0;
    this.weekOffCount = 0;

    const counts: Record<string, number> = {};
    let totalStatusDays = 0;

    this.calendarCells().forEach(c => {
      if (!c.isEmpty) {
        if (c.status === 'PD') pending++;
        else if (c.status === AttendanceStatus.Holiday) this.holidayCount++;
        else if (c.status === AttendanceStatus.WeekOff) this.weekOffCount++;
        else if (c.status) {
          counts[c.status] = (counts[c.status] || 0) + 1;
          totalStatusDays++;
        }
      }
    });

    this.pendingCount.set(pending);

    this.workingDays = totalStatusDays + pending;

    if (this.workingDays > 0) {
      this.pendingPercentage.set(Math.round((pending / this.workingDays) * 100));
    } else {
      this.pendingPercentage.set(0);
    }

    const statsArray: IDynamicStat[] = (statusList || [])
      .filter((status: any) => status.attendanceStatusCode !== AttendanceStatus.WeekOff)
      .map((status: any) => {
        const code = status.attendanceStatusCode;
        let count = counts[code] || 0;
        if (code === AttendanceStatus.Holiday) count = this.holidayCount;
        else if (code === 'PD') count = pending;

        let percentage = 0;
        if (code === AttendanceStatus.Holiday || code === AttendanceStatus.WeekOff) {
          percentage = this.daysInMonth() > 0 ? Math.round((count / this.daysInMonth()) * 100) : 0;
        } else {
          percentage = this.workingDays > 0 ? Math.round((count / this.workingDays) * 100) : 0;
        }

        return {
          code,
          name: status.attendanceStatusName || code,
          count,
          percentage,
          color: status.colorCode,
          bgColor: status.backgroundColorCode
        };
      });

    this.dynamicStats.set(statsArray);

    const legendsArray = statsArray.map(s => ({ name: s.name, color: s.color }));

    const woStatus = (statusList || []).find((s: any) => s.attendanceStatusCode === AttendanceStatus.WeekOff);
    if (woStatus) {
      legendsArray.push({
        name: woStatus.attendanceStatusName || 'Week Off',
        color: woStatus.colorCode
      });
    }

    const pdStatus = (statusList || []).find((s: any) => s.attendanceStatusCode === 'PD');
    legendsArray.push({
      name: pdStatus?.attendanceStatusName || 'Pending',
      color: pdStatus?.colorCode || '#9ca3af'
    });

    this.calendarLegends.set(legendsArray);
  }
}

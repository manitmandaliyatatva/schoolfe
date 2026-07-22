import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CalendarView as AngularCalendarView, CalendarEvent, CalendarModule } from 'angular-calendar';
import { addDays, isSameDay, isSameMonth } from 'date-fns';
import { Subject } from 'rxjs';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { FilterCondition } from '../../../../../core/models/request.model';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { API } from '../../../../../shared/constants/api-url';
import { buildGridToolbarButton } from '../../../../../shared/helpers/grid.helper';
import { EventsForm } from '../../../../admin/calendar/events/form/events-form';
import { CALENDAR_CONST, calendarStore } from '../models/calendar.model';
import { CalendarView } from '../view/calendar-view';
import { ToastrHelperService } from '../../../../../core/services/toster-helper.service';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';
import { AuthStore } from '../../../../../core/store/auth.store';

@Component({
  selector: 'common-calendar-list',
  standalone: true,
  imports: [
    CommonModule,
    CalendarModule,
    ButtonComponent,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './calendar-list.html',
  styleUrl: './calendar-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [calendarStore],
})
export class CalendarListComponent implements OnInit {
  protected store = inject(calendarStore);
  private readonly genericDialog = inject(GenericDialogService);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly toaster = inject(ToastrHelperService);
  readonly authStore = inject(AuthStore);

  private readonly academicYearHelper = inject(AcademicYearHelperService);

  readonly permission = computed(() => this.commonHelperService.getPermissionByPage());
  readonly isPastAcademicYear = computed(() =>
    CommonHelper.isPastAcademicYear(
      this.authStore.iscurrentacademicyear(),
      this.authStore.academicyearenddate()
    )
  );

  view: AngularCalendarView = AngularCalendarView.Month;
  AngularCalendarView = AngularCalendarView;
  viewDate: Date = new Date();
  activeDayIsOpen: boolean = false;
  refresh = new Subject<void>();

  readonly calendarMinDate = computed(() => this.academicYearHelper.getAcademicYearStartDate());
  readonly calendarMaxDate = computed(() => this.academicYearHelper.getDatepickerMaxDate());

  get isPrevDisabled(): boolean {
    const ayStartDate = this.academicYearHelper.getAcademicYearStartDate();

    if (this.view === AngularCalendarView.Month) {
      return isSameMonth(this.viewDate, ayStartDate) || this.viewDate < ayStartDate;
    }
    return this.viewDate <= ayStartDate;
  }

  get isNextDisabled(): boolean {
    const maxDate = this.academicYearHelper.getDatepickerMaxDate();

    if (this.view === AngularCalendarView.Month) {
      return isSameMonth(this.viewDate, maxDate) || this.viewDate > maxDate;
    }
    return this.viewDate >= maxDate;
  }

  readonly CALENDAR_CONST = CALENDAR_CONST;
  readonly SYSTEM_CONST = SYSTEM_CONST;

  addBtnConfig = computed<CommonButtonConfig>(() => ({
    ...buildGridToolbarButton({
      tooltipText: CALENDAR_CONST.ADD_EVENT,
      icon: 'add_2',
      callback: () => this.openEventDialog({ date: new Date() }),
      isPrimary: true
    }),
    visibleCallback: () => this.permission().canCreate && !this.isPastAcademicYear(),
  }));

  refreshBtnConfig = computed<CommonButtonConfig>(() => (CommonHelper.getRefreshButtonConfig(
    () => this.loadEvents()
  )));

  events = computed<CalendarEvent[]>(() => {
    return this.store.list().flatMap((item) => {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      const primaryColor =
        item.colorCode || (item.isHoliday ? '#e3bc08' : item.isExam ? '#ad2121' : '#1e90ff');
      const secondaryColor = item.colorCode
        ? this.lightenColor(item.colorCode, 0.11)
        : item.isHoliday
        ? '#FDF1BA'
        : item.isExam
        ? '#FAE3E3'
        : '#D1E8FF';

      const mapEvent = (s: Date, e: Date): CalendarEvent => ({
        id: item.eventId,
        title: item.eventTitle,
        start: s,
        end: e,
        allDay: item.isAllDay,
        meta: { event: item },
        color: {
          primary: primaryColor,
          secondary: secondaryColor,
        },
      });

      // If all day OR same day, don't split
      if (item.isAllDay || isSameDay(start, end)) {
        return [mapEvent(start, end)];
      }

      // Multi-day with times: Split into daily blocks with SAME time range
      const splitEvents: CalendarEvent[] = [];
      let current = new Date(start);
      const endDay = new Date(end);
      endDay.setHours(23, 59, 59, 999);

      while (current <= endDay) {
        const dStart = new Date(current);
        dStart.setHours(start.getHours(), start.getMinutes(), 0, 0);

        const dEnd = new Date(current);
        dEnd.setHours(end.getHours(), end.getMinutes(), 0, 0);

        splitEvents.push(mapEvent(dStart, dEnd));
        current = addDays(current, 1);
      }
      return splitEvents;
    });
  });

  protected getTooltip(event: CalendarEvent): string {
    const e = event.meta?.event;
    if (!e) return event.title;

    const parts = [];
    parts.push(`${CALENDAR_CONST.TITLE.toUpperCase()}: ${e.eventTitle}`);
    parts.push(`${CALENDAR_CONST.TYPE.toUpperCase()}: ${e.eventTypeName}`);

    if (e.isAllDay) {
      parts.push(
        `${SYSTEM_CONST.LABELS.COMMON.TIME.toUpperCase()}: ${CALENDAR_CONST.IS_ALL_DAY.replace(
          '?',
          ''
        )}`
      );
    } else {
      const start = formatDate(event.start, 'HH:mm', 'en-US');
      const end = formatDate(event.end, 'HH:mm', 'en-US');
      parts.push(`${SYSTEM_CONST.LABELS.COMMON.TIME.toUpperCase()}: ${start} - ${end}`);
    }

    if (e.location) parts.push(`${CALENDAR_CONST.LOCATION.toUpperCase()}: ${e.location}`);
    if (e.eventGroupName) parts.push(`${CALENDAR_CONST.GROUP.toUpperCase()}: ${e.eventGroupName}`);

    return parts.join('\n');
  }

  private lightenColor(hex: string, opacity: number): string {
    if (!hex.startsWith('#')) return hex;

    // Simple hex to rgba for secondary background effect
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  constructor() {
    effect(() => {
      const ayStart = this.calendarMinDate();
      const ayEnd = this.calendarMaxDate();
      if (ayStart > ayEnd) return;
      untracked(() => {
        this.viewDate = this.academicYearHelper.getValidAttendanceDate();
        this.closeOpenMonthViewDay();
        this.loadEvents();
      });
    });
  }

  setMonthAndYear = (normalizedMonthAndYear: Date, datepicker: any) => {
    const ctrlValue = new Date(this.viewDate);
    ctrlValue.setMonth(normalizedMonthAndYear.getMonth());
    ctrlValue.setFullYear(normalizedMonthAndYear.getFullYear());
    this.viewDate = ctrlValue;
    datepicker.close();
    this.closeOpenMonthViewDay();
    this.loadEvents();
  }

  ngOnInit() {
    if (!this.permission().canList) return;
    this.loadEvents();
  }

  private clampViewDate(): void {
    const minDate = this.calendarMinDate();
    const maxDate = this.calendarMaxDate();
    if (minDate > maxDate) return;
    if (this.viewDate < minDate) {
      this.viewDate = new Date(minDate);
    } else if (this.viewDate > maxDate) {
      this.viewDate = new Date(maxDate);
    }
  }

  loadEvents(): void {
    if (!this.permission().canList) return;
    this.clampViewDate();
    const date = this.viewDate;
    const fromDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const toDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const fromDateStr = formatDate(fromDate, 'yyyy-MM-dd', 'en-US');
    const toDateStr = formatDate(toDate, 'yyyy-MM-dd', 'en-US');

    this.store.getAll({
      endpoint: API.ADMIN.CALENDAR.EVENTS.LIST,
      body: {
        pageIndex: 0,
        pageSize: 1000,
        generalSearch: '',
        sortOrder: 'asc',
        defaultSortingColumn: 'startDate',
        columns: [
          {
            name: 'fromDate',
            filterSearch: {
              value: fromDateStr,
              condition: FilterCondition.Equals,
            },
          },
          {
            name: 'toDate',
            filterSearch: {
              value: toDateStr,
              condition: FilterCondition.Equals,
            },
          },
        ],
      },
    });
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    const today = this.academicYearHelper.getDatepickerMinDate();
    const maxDate = this.academicYearHelper.getDatepickerMaxDate();

    if (this.isPastAcademicYear()) {
      if (this.permission().canCreate) {
        this.toaster.showWarningMessage(CALENDAR_CONST.CANT_ADD_PAST_EVENT);
      }
      return;
    }

    if (date < today) {
      if (this.permission().canCreate) {
        this.toaster.showWarningMessage(CALENDAR_CONST.CANT_ADD_PAST_EVENT);
      }
      return;
    }

    if (date > maxDate) {
      if (this.permission().canCreate) {
        this.toaster.showWarningMessage(CALENDAR_CONST.CANT_ADD_EVENT_BEYOND);
      }
      return;
    }

    if (isSameMonth(date, this.viewDate)) {
      if (this.permission().canCreate) {
        this.openEventDialog({ date });
      }
      this.viewDate = date;
    }
  }

  eventClicked({ event }: { event: CalendarEvent }): void {
    this.openCalendarViewDialog(event.id);
  }

  openEventDialog(data?: any): void {
    const dialogRef = this.genericDialog.open({
      title: data?.id ? CALENDAR_CONST.EDIT_EVENT : CALENDAR_CONST.ADD_EVENT,
      component: EventsForm,
      width: '1000px',
      maxWidth: '95vw',
      data: data,
      showCloseButton: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadEvents();
      }
    });
  }

  openCalendarViewDialog(id: any): void {
    if(!this.permission().canView) return;
    const dialogRef = this.genericDialog.open<any, { action: string; id?: any }>({
      title: CALENDAR_CONST.EVENTS + ' Details',
      component: CalendarView,
      width: '800px',
      maxWidth: '90vw',
      data: { id },
      showCloseButton: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.action === 'edit') {
          this.openEventDialog({ id: result.id });
        } else if (result.action === 'deleted') {
          this.loadEvents();
        }
      }
    });
  }

  setView(view: AngularCalendarView) {
    this.view = view;
    this.clampViewDate();
    this.loadEvents();
  }

  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }
}

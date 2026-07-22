import { Component } from '@angular/core';
import { CalendarView as CommonCalendarView } from '../../../common/calendar/calendar/view/calendar-view';

@Component({
  selector: 'app-teacher-calendar-view',
  standalone: true,
  imports: [CommonCalendarView],
  template: `<common-calendar-view></common-calendar-view>`,
})
export class CalendarView {}

import { Component } from '@angular/core';
import { CalendarListComponent as CommonCalendarList } from '../../../common/calendar/calendar/list/calendar-list';

@Component({
  selector: 'app-teacher-calendar-list',
  standalone: true,
  imports: [CommonCalendarList],
  template: `<common-calendar-list></common-calendar-list>`,
})
export class CalendarListComponent {}

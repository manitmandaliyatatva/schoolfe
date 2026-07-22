import { Component } from '@angular/core';
import { TeacherTimetableComponent as CommonTeacherTimetableComponent } from '../../../common/timetable/teacher-timetable/list/teacher-timetable';

@Component({
  selector: 'app-teacher-my-timetable',
  imports: [CommonTeacherTimetableComponent],
  template: `<app-teacher-timetable></app-teacher-timetable>`,
})
export class TeacherTimetableComponent {}

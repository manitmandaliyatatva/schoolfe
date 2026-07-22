import { Component } from '@angular/core';
import { ClassroomTimetableComponent as CommonClassroomTimetableComponent } from '../../../common/timetable/classroom-timetable/list/classroom-timetable';

@Component({
  selector: 'app-student-classroom-timetable',
  imports: [CommonClassroomTimetableComponent],
  template: `<app-classroom-timetable></app-classroom-timetable>`,
})
export class StudentClassroomTimetableComponent { }


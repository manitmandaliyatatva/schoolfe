import { Component } from '@angular/core';
import { AttendanceComponent } from '../../../common/attendance/form/attendance';

@Component({
  selector: 'student-attendance',
  imports: [AttendanceComponent],
  template: `<take-student-attendance></take-student-attendance>`
})
export class StudentAttendance {

}

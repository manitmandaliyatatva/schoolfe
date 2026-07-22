import { Component } from '@angular/core';
import { AttendanceComponent } from '../../../common/attendance/form/attendance';
@Component({
  selector: 'app-take-student-attendance',
  standalone: true,
  imports: [AttendanceComponent],
  template: `<take-student-attendance></take-student-attendance>`
})
export class TakeStudentAttendance {
}

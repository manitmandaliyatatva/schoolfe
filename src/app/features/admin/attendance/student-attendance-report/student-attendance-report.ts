import { Component } from '@angular/core';
import { ViewMonthlyAttendance } from '../../../common/attendance/view-monthly-attendance/view-monthly-attendance';

@Component({
  selector: 'app-student-attendance-report',
    imports: [ViewMonthlyAttendance],
    template: `<app-view-monthly-attendance mode='student' pageType="report"></app-view-monthly-attendance>`
})
export class StudentAttendanceReport {

}

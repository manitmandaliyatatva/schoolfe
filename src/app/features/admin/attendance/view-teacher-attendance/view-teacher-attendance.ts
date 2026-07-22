import { Component } from '@angular/core';
import { ViewMonthlyAttendance } from '../../../common/attendance/view-monthly-attendance/view-monthly-attendance';

@Component({
  selector: 'app-view-teacher-attendance',
  imports: [ViewMonthlyAttendance],
  template: `<app-view-monthly-attendance mode="admin" pageType="view"></app-view-monthly-attendance>`
})
export class ViewTeacherAttendance {

}

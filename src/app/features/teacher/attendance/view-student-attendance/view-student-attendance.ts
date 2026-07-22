import { Component } from "@angular/core";
import { ViewMonthlyAttendance } from "../../../common/attendance/view-monthly-attendance/view-monthly-attendance";

@Component({
  selector: '',
  imports: [ViewMonthlyAttendance],
  template: `<app-view-monthly-attendance mode='teacher' pageType="view"><app-view-monthly-attendance>`
})
export class ViewStudentAttendance {

}
import { Route } from "@angular/router";
import { Attandence } from "./attendance";
import { authGuard } from "../../../core/guards/auth-guard";
import { TeacherAttandence } from "./take-teacher-attendence/take-teacher-attendence";
import { StudentAttendance } from "./take-student-attendance/take-student-attendance";
import { ViewTeacherAttendance } from "./view-teacher-attendance/view-teacher-attendance";
import { TeacherAttendanceReport } from "./teacher-attendance-report/teacher-attendance-report";
import { StudentAttendanceReport } from "./student-attendance-report/student-attendance-report";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";
import { ADMIN_ROUTE } from "../../../shared/constants/route.constant";
import { roleGuard } from "../../../core/guards/role-guard";

export const ATTENDANCE_ROUTES: Route[] = [
    {
        path: '',
        component: Attandence,
        canActivate: [authGuard],
        canActivateChild :[roleGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: ADMIN_ROUTE.ATTENDANCE.TEACHER,
            },
            {
                path: ADMIN_ROUTE.ATTENDANCE.TEACHER,
                component: TeacherAttandence,
                title: GetPageTitle(TITLES.ATTENDANCE.TEACHER_ATTAENDANCE)
            },
            {
                path: ADMIN_ROUTE.ATTENDANCE.STUDENT,
                component: StudentAttendance,
                title: GetPageTitle(TITLES.ATTENDANCE.STUDENT_ATTAENDANCE),
            },
            {
                path: ADMIN_ROUTE.ATTENDANCE.VIEW_TEACHER,
                component: ViewTeacherAttendance,
                title: GetPageTitle(TITLES.ATTENDANCE.VIEW_TEACHER_ATTENDANCE),
            },
            {
                path: ADMIN_ROUTE.ATTENDANCE.TEACHER_MONTHLY_REPORT,
                component: TeacherAttendanceReport,
                title: GetPageTitle(TITLES.ATTENDANCE.TEACHER_MONTHLY_REPORT),
            },
            {
                path: ADMIN_ROUTE.ATTENDANCE.STUDENT_MONTHLY_REPORT,
                component: StudentAttendanceReport,
                title: GetPageTitle(TITLES.ATTENDANCE.STUDENT_MONTHLY_REPORT),
            },
        ]
    }
]
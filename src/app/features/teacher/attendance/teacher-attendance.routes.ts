import { Route } from "@angular/router";
import { authGuard } from "../../../core/guards/auth-guard";
import { ADMIN_ROUTE } from "../../../shared/constants/route.constant";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";
import { TeacherAttendance } from "./teacher-attendance";
import { TakeStudentAttendance } from "./take-student-attendance/take-student-attendance";
import { ViewStudentAttendance } from "./view-student-attendance/view-student-attendance";
import { MyAttendance } from "../../common/attendance/my-attendance/my-attendance";

export const TEACHER_ATTENDANCE_ROUTES: Route[] = [
    {
        path: '',
        component: TeacherAttendance,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: ADMIN_ROUTE.COMMUNICATION.NOTICE_TYPE,
            },
            //Notice
            {
                path: ADMIN_ROUTE.TEACHAR_ATTENDANCE.ADD,
                component: TakeStudentAttendance,
                title: GetPageTitle(TITLES.ATTENDANCE.STUDENT_ATTAENDANCE),
            },
            {
                path: ADMIN_ROUTE.TEACHAR_ATTENDANCE.LIST,
                component: ViewStudentAttendance,
                title: GetPageTitle(TITLES.ATTENDANCE.STUDENT_ATTAENDANCE),
            },
            {
                path: ADMIN_ROUTE.TEACHAR_ATTENDANCE.MY_ATTENDANCE,
                component: MyAttendance,
                title: GetPageTitle(TITLES.STUDENT.MY_ATTENDENCE),
            }
        ],
    },
]

import { Route } from "@angular/router";
import { SYSTEM_CONST } from "../../core/constants/system.constant";
import { authGuard } from "../../core/guards/auth-guard";
import { roleGuard } from "../../core/guards/role-guard";
import { MainLayout } from "../../core/layouts/main-layout/main-layout";
import { GetPageTitle, TITLES } from "../../shared/constants/title.constant";
import { NotFound } from "../not-found/not-found";
import { TeacherDashboard } from "./teacher-dashboard/teacher-dashboard";
import { ViewNotices } from "../common/communication/view-notices/view-notices";

export const TEACHER_ROUTE: Route[] = [
    {
        path: '',
        component: MainLayout,
        canActivate: [authGuard],
        canActivateChild: [roleGuard],
        children: [
            {
                path: 'dashboard',
                component: TeacherDashboard,
                title: GetPageTitle(TITLES.TEACHER.DASHBOARD),
            },
            {
                path: 'notices',
                component: ViewNotices,
                title: GetPageTitle(TITLES.ADMIN.NOTICES),
            },
            {
                path: 'profile',
                loadChildren: () => import('./my-profile/my-profile.route').then((m) => m.TEACHER_PROFILE_ROUTES),
            },
            {
                path: 'timetable',
                loadChildren: () => import('./my-timetable/teacher-timetable.route').then(m => m.TEACHER_TIMETABLE_ROUTES),
            },
            {
                path: 'calendar',
                loadChildren: () => import('./calendar/calendar.route').then(m => m.TEACHER_CALENDAR_ROUTES)
            },
            {
                path: 'communication',
                loadChildren: () => import('./communication/teacher-communication.route').then(x => x.TEACHER_COMMUNICATION_ROUTES),
            },
            {
                path: 'examination',
                loadChildren: () => import('./examination/teacher-examination.route').then(m => m.TEACHER_EXAMINATION_ROUTES),
            },
            {
                path: 'homework',
                loadChildren: () => import('./homeworks/teacher-homework.route').then(m => m.TEACHER_HOMEWORK_ROUTES),
            },
            {
                path: 'class-students',
                loadChildren: () => import('./my-student/my-student.route').then(m => m.TEACHER_MY_STUDENT_ROUTES),
            },
            {
                path: 'attendance',
                loadChildren: () => import('./attendance/teacher-attendance.routes').then(x => x.TEACHER_ATTENDANCE_ROUTES),
            },
            { path: '**', component: NotFound, title: GetPageTitle(SYSTEM_CONST.ERRORS.NOT_FOUND.TITLE), }
        ],
    },
]
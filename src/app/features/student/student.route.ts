import { Route } from "@angular/router";
import { SYSTEM_CONST } from "../../core/constants/system.constant";
import { authGuard } from "../../core/guards/auth-guard";
import { roleGuard } from "../../core/guards/role-guard";
import { MainLayout } from "../../core/layouts/main-layout/main-layout";
import { GetPageTitle, TITLES } from '../../shared/constants/title.constant';
import { NotFound } from '../not-found/not-found';
import { StudentDashboard } from "./student-dashboard/student-dashboard";
import { MyAttendance } from "../common/attendance/my-attendance/my-attendance";
import { ViewNotices } from "../common/communication/view-notices/view-notices";

export const STUDENT_ROUTE: Route[] = [
    {
        path: '',
        component: MainLayout,
        canActivate: [authGuard],
        canActivateChild: [roleGuard],
        children: [
            {
                path: 'dashboard',
                component: StudentDashboard,
                title: GetPageTitle(TITLES.STUDENT.DASHBOARD),
            },
            {
                path: 'notices',
                component: ViewNotices,
                title: GetPageTitle(TITLES.ADMIN.NOTICES),
            },
            {
                path: 'profile',
                loadChildren: () => import('./my-profile/my-profile.route').then((m) => m.STUDENT_PROFILE_ROUTES),
            },
            {
                path: 'communication',
                loadChildren: () => import('./communication/student-communication.route').then(x => x.STUDENT_COMMUNICATION_ROUTES),
            },
            {
                path: 'calendar',
                loadChildren: () => import('./calendar/calendar.route').then(m => m.STUDENT_CALENDAR_ROUTES)
            },
            {
                path: 'timetable',
                loadChildren: () => import('./my-timetable/student-timetable.route').then(x => x.STUDENT_TIMETABLE_ROUTES),
            },
            {
                path: 'attendance',
                component: MyAttendance,
                title: GetPageTitle(TITLES.STUDENT.MY_ATTENDENCE),
            },
            {
                path: 'examination',
                loadChildren: () => import('./examination/examination.route').then((m) => m.EXAMINATION_ROUTES),
            },
            {
                path: 'homeworks',
                loadChildren: () => import('./homeworks/student-homework.route').then(m => m.STUDENT_HOMEWORK_ROUTES),
            },
            {
                path: 'subjects',
                loadChildren: () => import('./my-subjects/student-subject.route').then(m => m.STUDENT_SUBJECT_ROUTES),
            },
            {
                path: 'teachers',
                loadChildren: () => import('./teachers/student-teacher.route').then(m => m.STUDENT_TEACHER_ROUTES),
            },
            {
                path: 'classmates',
                loadChildren: () => import('./classmates/classmates.route').then(m => m.STUDENT_CLASSMATES_ROUTES),
            },
            {
                path: 'fee',
                loadChildren: () => import('./fee/student-fee.route').then(m => m.STUDENT_FEE_ROUTES),
            },
            { path: '**', component: NotFound, title: GetPageTitle(SYSTEM_CONST.ERRORS.NOT_FOUND.TITLE), }

        ],
    },
]


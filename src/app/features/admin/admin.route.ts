import { Route } from "@angular/router";
import { SYSTEM_CONST } from "../../core/constants/system.constant";
import { authGuard } from "../../core/guards/auth-guard";
import { roleGuard } from "../../core/guards/role-guard";
import { MainLayout } from "../../core/layouts/main-layout/main-layout";
import { GetPageTitle, TITLES } from "../../shared/constants/title.constant";
import { NotFound } from "../not-found/not-found";
import { Dashboard } from "./dashboard/dashboard";
import { ViewNotices } from "../common/communication/view-notices/view-notices";

export const ADMIN_ROUTES: Route[] = [
    {
        path: '',
        component: MainLayout,
        canActivate: [authGuard],
        canActivateChild: [roleGuard],
        children: [
            {
                path: 'dashboard',
                component: Dashboard,
                title: GetPageTitle(TITLES.ADMIN.DASHBOARD),
            },
            {
                path: 'notices',
                component: ViewNotices,
                title: GetPageTitle(TITLES.ADMIN.NOTICES),
            },
            {
                canActivate: [authGuard],
                path: 'configuration',
                loadChildren: () => import('./configuration/configuration.route').then(r => r.CONFIGURATION_ROUTES)
            },
            {
                canActivate: [authGuard],
                path: 'communication',
                loadChildren: () => import('./communication/admin-communication.route').then(r => r.COMMUNICATION_ROUTES)
            },
            {
                canActivate: [authGuard],
                path: 'user',
                loadChildren: () => import('./user/user.routes').then(r => r.USER_ROUTE)
            },
            {
                canActivate: [authGuard],
                path: 'class',
                loadChildren: () => import('./classes/classes.route').then(m => m.CLASSES_ROUTES)
            },
            {
                canActivate: [authGuard],
                path: 'examination',
                loadChildren: () => import('./examination/examination.route').then(m => m.EXAMINATION_ROUTES),
            },
            {
                canActivate: [authGuard],
                path: 'timetable',
                loadChildren: () => import('./timetable/timetable.route').then(m => m.TIMETABLE_ROUTES)
            },
            {
                canActivate: [authGuard],
                path: 'fee',
                loadChildren: () => import('./fee/fee.routes').then(m => m.FEE_ROUTE)
            },
            {
                canActivate: [authGuard],
                path: 'homework',
                loadChildren: () => import('./homeworks/homework.route').then(m => m.HOMEWORK_ROUTES)
            },
            {
                canActivate: [authGuard],
                path: 'attendance',
                loadChildren: () => import('./attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES)
            },
            {
                canActivate: [authGuard],
                path: 'site-configuration',
                loadChildren: () => import('./public-site/public-site.route').then(m => m.PUBLIC_SITE_ROUTE)
            },
            {
                canActivate: [authGuard],
                path: 'setting',
                loadChildren: () => import('./settings/settings.route').then(m => m.SETTINGS_ROUTE)
            },
            {
                canActivate: [authGuard],
                path: 'calendar',
                loadChildren: () => import('./calendar/calendar.route').then(m => m.CALENDAR_ROUTES)
            },
            { path: '**', component: NotFound, title: GetPageTitle(SYSTEM_CONST.ERRORS.NOT_FOUND.TITLE), }
        ],
    },
]


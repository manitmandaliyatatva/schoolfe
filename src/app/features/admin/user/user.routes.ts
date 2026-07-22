import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';

import { Route } from "@angular/router";
import { authGuard } from "../../../core/guards/auth-guard";
import { ADMIN_ROUTE } from "../../../shared/constants/route.constant";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";
import { UserForm } from "./user/form/user-form";
import { UserComponent } from "./user/list/user";
import { UserComponent as user } from "./user"
import { StudentComponent } from "./student/list/student";
import { StudentForm } from "./student/form/student-form";
import { RoleForm } from "./role/form/role-form";
import { RoleComponent } from "./role/list/role";
import { TeacherComponent } from "./teacher/list/teacher";
import { TeacherForm } from "./teacher/form/teacher-form";
import { TeacherView } from "./teacher/view/teacher-view";
import { StudentView } from "./student/view/student-view";
import { RolePermissionsComponent } from "./role-permissions/role-permissions";
import { PageComponent } from "./page/list/page";
import { PageForm } from "./page/form/page-form";
import { DashboardPermissionComponent } from "./dashboard-permission/dashboard-permission";


export const USER_ROUTE: Route[] = [
    {
        path: '',
        component: user,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: ADMIN_ROUTE.USER.USERS,
            },
            {
                path: ADMIN_ROUTE.USER.USERS,
                component: UserComponent,
                title: GetPageTitle(TITLES.USER.USERS),
            },
            {
                path: `${ADMIN_ROUTE.USER.USERS}/add`,
                component: UserForm,
                title: GetPageTitle(TITLES.USER.USERS),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: `${ADMIN_ROUTE.USER.USERS}/edit/:userId`,
                component: UserForm,
                title: GetPageTitle(TITLES.USER.USERS),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.USER.ROLES,
                component: RoleComponent,
                title: GetPageTitle(TITLES.USER.ROLE),
            },
            {
                path: `${ADMIN_ROUTE.USER.ROLES}/add`,
                component: RoleForm,
                title: GetPageTitle(TITLES.USER.ROLE),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: `${ADMIN_ROUTE.USER.ROLES}/edit/:roleId`,
                component: RoleForm,
                title: GetPageTitle(TITLES.USER.ROLE),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.USER.ROLE_PERMISSIONS,
                component: RolePermissionsComponent,
                title: GetPageTitle(TITLES.USER.ROLE_PERMISSIONS),
            },
            {
                path: ADMIN_ROUTE.USER.PAGES,
                component: PageComponent,
                title: GetPageTitle(TITLES.USER.PAGES),
            },
            {
                path: `${ADMIN_ROUTE.USER.PAGES}/add`,
                component: PageForm,
                title: GetPageTitle(TITLES.USER.PAGES),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: `${ADMIN_ROUTE.USER.PAGES}/edit/:pageId`,
                component: PageForm,
                title: GetPageTitle(TITLES.USER.PAGES),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.USER.DASHBOARD_PERMISSION,
                component: DashboardPermissionComponent,
                title: GetPageTitle(TITLES.USER.DASHBOARD_PERMISSION),
            },
            {
                path: ADMIN_ROUTE.USER.STUDENTS,
                component: StudentComponent,
                title: GetPageTitle(TITLES.USER.STUDENT),
            },
            {
                path: `${ADMIN_ROUTE.USER.STUDENTS}/add`,
                component: StudentForm,
                title: GetPageTitle(TITLES.USER.STUDENT),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: `${ADMIN_ROUTE.USER.STUDENTS}/edit/:studentId`,
                component: StudentForm,
                title: GetPageTitle(TITLES.USER.STUDENT),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: `${ADMIN_ROUTE.USER.STUDENTS}/view/:studentId`,
                component: StudentView,
                title: GetPageTitle(TITLES.USER.VIEW_STUDENT),
            },
            {
                path: ADMIN_ROUTE.USER.TEACHERS,
                component: TeacherComponent,
                title: GetPageTitle(TITLES.USER.TEACHER),
            },
            {
                path: `${ADMIN_ROUTE.USER.TEACHERS}/add`,
                component: TeacherForm,
                title: GetPageTitle(TITLES.USER.TEACHER),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: `${ADMIN_ROUTE.USER.TEACHERS}/edit/:teacherId`,
                component: TeacherForm,
                title: GetPageTitle(TITLES.USER.TEACHER),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: `${ADMIN_ROUTE.USER.TEACHERS}/view/:teacherId`,
                component: TeacherView,
                title: GetPageTitle(TITLES.USER.VIEW_TEACHER),
            }
        ],
    },
]

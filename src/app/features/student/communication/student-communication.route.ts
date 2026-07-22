import { Route } from "@angular/router";
import { authGuard } from "../../../core/guards/auth-guard";
import { ADMIN_ROUTE } from "../../../shared/constants/route.constant";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";
import { StudentCommunication } from "./student-communication";
import { StudentNoticeList } from "./notice/list/student-notice-list";
import { roleGuard } from "../../../core/guards/role-guard";

export const STUDENT_COMMUNICATION_ROUTES: Route[] = [
    {
        path: '',
        component: StudentCommunication,
        canActivate: [authGuard],
        canActivateChild :[roleGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: ADMIN_ROUTE.COMMUNICATION.NOTICE_TYPE,
            },
            //Notice
            {
                path: ADMIN_ROUTE.COMMUNICATION.NOTICE,
                component: StudentNoticeList,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE),
            },
        ],
    },
]

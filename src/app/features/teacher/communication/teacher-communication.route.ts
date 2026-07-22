import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { Route } from "@angular/router";
import { authGuard } from "../../../core/guards/auth-guard";
import { ADMIN_ROUTE } from "../../../shared/constants/route.constant";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";
import { TeacheerNoticeList as TeacherNoticeList } from "./notice/list/teacher-notice-list";
import { TeacherCommunication } from "./teacher-communication";
import { TeacherNoticeForm } from "./notice/form/teacher-notice-form";
import { TeacherNoticeAudianceGroupList } from "./notice-audiance-group/lists/teacher-notice-audiance-group-list";
import { TeacherNoticeAudianceGroupForm } from "./notice-audiance-group/form/teacher-notice-audiance-group-form";

export const TEACHER_COMMUNICATION_ROUTES: Route[] = [
    {
        path: '',
        component: TeacherCommunication,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: ADMIN_ROUTE.COMMUNICATION.NOTICE_TYPE,
            },
            //Notice
            {
                path: ADMIN_ROUTE.COMMUNICATION.NOTICE,
                component: TeacherNoticeList,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE),
            },
            {
                path: ADMIN_ROUTE.COMMUNICATION.ADD_NOTICE,
                component: TeacherNoticeForm,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE),
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.COMMUNICATION.EDIT_NOTICE,
                component: TeacherNoticeForm,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE),
            //canDeactivate: [pendingChangesGuard],
                },
            //Notice Group
            {
                path: ADMIN_ROUTE.COMMUNICATION.NOTICE_AUDIENCE_GROUP,
                component: TeacherNoticeAudianceGroupList,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE_AUDIENCE_GROUP),
            },
            {
                path: ADMIN_ROUTE.COMMUNICATION.ADD_NOTICE_AUDIENCE_GROUP,
                component: TeacherNoticeAudianceGroupForm,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE_AUDIENCE_GROUP),
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.COMMUNICATION.EDIT_NOTICE_AUDIENCE_GROUP,
                component: TeacherNoticeAudianceGroupForm,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE_AUDIENCE_GROUP),
            //canDeactivate: [pendingChangesGuard],
                }
        ],
    },
]

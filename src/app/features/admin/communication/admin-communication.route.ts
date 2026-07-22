import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { Route } from "@angular/router";
import { AdminCommunication } from "./admin-communication";
import { authGuard } from "../../../core/guards/auth-guard";
import { ADMIN_ROUTE } from "../../../shared/constants/route.constant";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";
import { NoticeTypeList } from "./notice-type/list/notice-type-list";
import { NoticeTypeForm } from "./notice-type/form/notice-type-form";
import { AdminNoticeList } from "./notice/list/admin-notice-list";
import { AdminNoticeForm } from "./notice/form/admin-notice-form";
import { AdminNoticeAudianceGroupList } from "./notice-audiance-group/lists/admin-notice-audiance-group-list";
import { AdminNoticeAudianceGroupForm } from "./notice-audiance-group/form/admin-notice-audiance-group-form";

export const COMMUNICATION_ROUTES: Route[] = [
    {
        path: '',
        component: AdminCommunication,
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
                component: AdminNoticeList,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE),
            },
            {
                path: ADMIN_ROUTE.COMMUNICATION.ADD_NOTICE,
                component: AdminNoticeForm,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.COMMUNICATION.EDIT_NOTICE,
                component: AdminNoticeForm,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE),
                //canDeactivate: [pendingChangesGuard],
            },
            //Notice Type
            {
                path: ADMIN_ROUTE.COMMUNICATION.NOTICE_TYPE,
                component: NoticeTypeList,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE_TYPE),
            },
            {
                path: ADMIN_ROUTE.COMMUNICATION.ADD_NOTICE_TYPE,
                component: NoticeTypeForm,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE_TYPE),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.COMMUNICATION.EDIT_NOTICE_TYPE,
                component: NoticeTypeForm,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE_TYPE),
                //canDeactivate: [pendingChangesGuard],
            },
            //Notice Audience Group
            {
                path: ADMIN_ROUTE.COMMUNICATION.NOTICE_AUDIENCE_GROUP,
                component: AdminNoticeAudianceGroupList,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE_AUDIENCE_GROUP),
            },
            {
                path: ADMIN_ROUTE.COMMUNICATION.ADD_NOTICE_AUDIENCE_GROUP,
                component: AdminNoticeAudianceGroupForm,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE_AUDIENCE_GROUP),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.COMMUNICATION.EDIT_NOTICE_AUDIENCE_GROUP,
                component: AdminNoticeAudianceGroupForm,
                title: GetPageTitle(TITLES.COMMUNICATION.NOTICE_AUDIENCE_GROUP),
                //canDeactivate: [pendingChangesGuard],
            }
        ],
    },
]

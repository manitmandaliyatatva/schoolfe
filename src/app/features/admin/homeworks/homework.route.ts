import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { Route } from "@angular/router";
import { authGuard } from "../../../core/guards/auth-guard";
import { ADMIN_ROUTE } from "../../../shared/constants/route.constant";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";
import { HomeworkList } from "./homeworks/list/homework-list";
import { HomeworkForm } from "./homeworks/form/homework-form";
import { HomeworkReviewList } from "./review/list/homework-review-list";
import { HomeworkReviewDetail } from "./review/detail/homework-review-detail";

export const HOMEWORK_ROUTES: Route[] = [
    {
        path: '',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: ADMIN_ROUTE.HOMEWORK.LIST,
            },
            {
                path: ADMIN_ROUTE.HOMEWORK.LIST,
                component: HomeworkList,
                title: GetPageTitle(TITLES.HOMEWORK),
            },
            {
                path: ADMIN_ROUTE.HOMEWORK.ADD,
                component: HomeworkForm,
                title: GetPageTitle(TITLES.HOMEWORK),
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.HOMEWORK.EDIT,
                component: HomeworkForm,
                title: GetPageTitle(TITLES.HOMEWORK),
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.HOMEWORK.REVIEWS,
                component: HomeworkReviewList,
                title: GetPageTitle(TITLES.ADMIN.HOMEWORK_REVIEW),
            },
            {
                path: ADMIN_ROUTE.HOMEWORK.REVIEW_VIEW,
                component: HomeworkReviewDetail,
                title: GetPageTitle(TITLES.ADMIN.HOMEWORK_REVIEW),
            },
            {
                path: ADMIN_ROUTE.HOMEWORK.REVIEW_EDIT,
                component: HomeworkReviewDetail,
                title: GetPageTitle(TITLES.ADMIN.HOMEWORK_REVIEW),
            }
        ]
    }
];

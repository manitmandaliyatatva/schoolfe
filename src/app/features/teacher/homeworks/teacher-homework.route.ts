import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { Route } from '@angular/router';
import { authGuard } from '../../../core/guards/auth-guard';
import { ADMIN_ROUTE } from '../../../shared/constants/route.constant';
import { GetPageTitle, TITLES } from '../../../shared/constants/title.constant';
import { TeacherHomeworkForm } from './homeworks/form/teacher-homework-form';
import { TeacherHomeworkList } from './homeworks/list/teacher-homework-list';
import { TeacherHomeworkReviewDetail } from './review/detail/teacher-homework-review-detail';
import { TeacherHomeworkReviewList } from './review/list/teacher-homework-review-list';

export const TEACHER_HOMEWORK_ROUTES: Route[] = [
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
        component: TeacherHomeworkList,
        title: GetPageTitle(TITLES.HOMEWORK),
      },
      {
        path: ADMIN_ROUTE.HOMEWORK.ADD,
        component: TeacherHomeworkForm,
        title: GetPageTitle(TITLES.HOMEWORK),
        //canDeactivate: [pendingChangesGuard],
      },
      {
        path: ADMIN_ROUTE.HOMEWORK.EDIT,
        component: TeacherHomeworkForm,
        title: GetPageTitle(TITLES.HOMEWORK),
        //canDeactivate: [pendingChangesGuard],
      },
      {
        path: ADMIN_ROUTE.HOMEWORK.REVIEWS,
        component: TeacherHomeworkReviewList,
        title: GetPageTitle(TITLES.ADMIN.HOMEWORK_REVIEW),
      },
      {
        path: ADMIN_ROUTE.HOMEWORK.REVIEW_VIEW,
        component: TeacherHomeworkReviewDetail,
        title: GetPageTitle(TITLES.ADMIN.HOMEWORK_REVIEW),
      },
      {
        path: ADMIN_ROUTE.HOMEWORK.REVIEW_EDIT,
        component: TeacherHomeworkReviewDetail,
        title: GetPageTitle(TITLES.ADMIN.HOMEWORK_REVIEW),
      },
    ],
  },
];


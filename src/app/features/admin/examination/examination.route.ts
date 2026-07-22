import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { Route } from '@angular/router';
import { authGuard } from '../../../core/guards/auth-guard';
import { ADMIN_ROUTE } from '../../../shared/constants/route.constant';
import { GetPageTitle, TITLES } from '../../../shared/constants/title.constant';
import { Examination } from './examination';
import { ExamTypeForm } from './examtype/form/examtype-form';
import { ExamTypeComponent } from './examtype/list/examtype';
import { ExamGroupForm } from './exam-groups/form/exam-group-form';
import { ExamGroupListComponent } from './exam-groups/list/exam-group-list';
import { ExamGroupMarksListComponent } from './exam-group-marks/list/exam-group-marks-list';
import { ExamGroupMarksEditComponent } from './exam-group-marks/edit/exam-group-marks-edit.component';
import { ExamGroupMarksViewComponent } from './exam-group-marks/view/exam-group-marks-view.component';

export const EXAMINATION_ROUTES: Route[] = [
  {
    path: '',
    component: Examination,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: ADMIN_ROUTE.EXAMINATION.EXAM_TYPES,
      },
      {
        path: ADMIN_ROUTE.EXAMINATION.EXAM_TYPES,
        component: ExamTypeComponent,
        title: GetPageTitle(TITLES.ADMIN.EXAM_TYPE),
      },
      {
        path: ADMIN_ROUTE.EXAMINATION.EXAMTYPE_ADD,
        component: ExamTypeForm,
        title: GetPageTitle(TITLES.ADMIN.EXAM_TYPE),
      //canDeactivate: [pendingChangesGuard],
                },
      {
        path: ADMIN_ROUTE.EXAMINATION.EXAMTYPE_EDIT,
        component: ExamTypeForm,
        title: GetPageTitle(TITLES.ADMIN.EXAM_TYPE),
      //canDeactivate: [pendingChangesGuard],
                },
      {
        path: ADMIN_ROUTE.EXAMINATION.EXAMS,
        component: ExamGroupListComponent,
        title: GetPageTitle(TITLES.ADMIN.EXAM_GROUP),
      },
      {
        path: ADMIN_ROUTE.EXAMINATION.EXAMS_ADD,
        component: ExamGroupForm,
        title: GetPageTitle(TITLES.ADMIN.EXAM_GROUP),
      },
      {
        path: ADMIN_ROUTE.EXAMINATION.EXAMS_EDIT,
        component: ExamGroupForm,
        title: GetPageTitle(TITLES.ADMIN.EXAM_GROUP),
      },
      {
        path: ADMIN_ROUTE.EXAMINATION.MARKS,
        component: ExamGroupMarksListComponent,
        title: GetPageTitle(TITLES.ADMIN.EXAM_GROUP_MARKS),
      },
      {
        path: ADMIN_ROUTE.EXAMINATION.MARKS_EDIT,
        component: ExamGroupMarksEditComponent,
        title: GetPageTitle(TITLES.ADMIN.EXAM_GROUP_MARKS),
      },
      {
        path: ADMIN_ROUTE.EXAMINATION.MARKS_VIEW,
        component: ExamGroupMarksViewComponent,
        title: GetPageTitle(TITLES.ADMIN.EXAM_GROUP_MARKS),
      },
    ],
  },
];

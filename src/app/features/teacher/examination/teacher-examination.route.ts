import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { Route } from '@angular/router';
import { authGuard } from '../../../core/guards/auth-guard';
import { ADMIN_ROUTE } from '../../../shared/constants/route.constant';
import { GetPageTitle, TITLES } from '../../../shared/constants/title.constant';
import { TeacherExamForm } from './exams/form/teacher-exam-form';
import { TeacherExamList } from './exams/list/teacher-exam-list';
import { TeacherMarksViewComponent } from './marks/view/teacher-marks-view';
import { TeacherMarksEditComponent } from './marks/edit/teacher-marks-edit';
import { TeacherMarksList } from './marks/list/teacher-marks-list';
import { TeacherExamination } from './teacher-examination';

export const TEACHER_EXAMINATION_ROUTES: Route[] = [
  {
    path: '',
    component: TeacherExamination,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: ADMIN_ROUTE.EXAMINATION.EXAMS,
      },
      {
        path: ADMIN_ROUTE.EXAMINATION.EXAMS,
        component: TeacherExamList,
        title: GetPageTitle(TITLES.TEACHER.EXAMS),
      },
      {
        path: ADMIN_ROUTE.EXAMINATION.EXAMS_ADD,
        component: TeacherExamForm,
        title: GetPageTitle(TITLES.TEACHER.EXAMS),
      //canDeactivate: [pendingChangesGuard],
                },
      {
        path: ADMIN_ROUTE.EXAMINATION.EXAMS_EDIT,
        component: TeacherExamForm,
        title: GetPageTitle(TITLES.TEACHER.EXAMS),
      //canDeactivate: [pendingChangesGuard],
                },
      {
        path: ADMIN_ROUTE.EXAMINATION.MARKS,
        component: TeacherMarksList,
        title: GetPageTitle(TITLES.ADMIN.MARKS),
      },
      {
        path: ADMIN_ROUTE.EXAMINATION.MARKS_VIEW,
        component: TeacherMarksViewComponent,
        title: GetPageTitle(TITLES.ADMIN.MARKS),
      },
      {
        path: ADMIN_ROUTE.EXAMINATION.MARKS_EDIT,
        component: TeacherMarksEditComponent,
        title: GetPageTitle(TITLES.ADMIN.MARKS),
      },
    ],
  },
];


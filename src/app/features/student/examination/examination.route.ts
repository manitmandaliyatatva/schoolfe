import { Route } from '@angular/router';
import { authGuard } from '../../../core/guards/auth-guard';
import { GetPageTitle, TITLES } from '../../../shared/constants/title.constant';
import { Examination } from './examination';
import { MyResultListComponent } from './my-result/list/my-result';
import { StudentExamList } from './exams/list/student-exam-list';

export const EXAMINATION_ROUTES: Route[] = [
  {
    path: '',
    component: Examination,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'results',
      },
      {
        path: 'exams',
        component: StudentExamList,
        title: GetPageTitle(TITLES.STUDENT.EXAMS),
      },
      {
        path: 'results',
        component: MyResultListComponent,
        title: GetPageTitle(TITLES.STUDENT.MY_RESULTS),
      },
    ],
  },
];

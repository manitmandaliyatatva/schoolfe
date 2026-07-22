import { Route } from '@angular/router';
import { GetPageTitle, TITLES } from '../../../shared/constants/title.constant';
import { StudentHomeworkList } from './list/student-homework-list';

export const STUDENT_HOMEWORK_ROUTES: Route[] = [
  {
    path: '',
    component: StudentHomeworkList,
    title: GetPageTitle(TITLES.HOMEWORK),
  },
];

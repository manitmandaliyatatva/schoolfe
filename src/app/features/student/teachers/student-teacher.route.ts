import { Route } from '@angular/router';
import { GetPageTitle, TITLES } from '../../../shared/constants/title.constant';
import { StudentTeacherList } from './list/student-teacher-list';

export const STUDENT_TEACHER_ROUTES: Route[] = [
  {
    path: '',
    component: StudentTeacherList,
    title: GetPageTitle(TITLES.USER.TEACHER),
  },
];

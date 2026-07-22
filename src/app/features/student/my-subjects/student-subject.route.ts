import { Route } from '@angular/router';
import { GetPageTitle, TITLES } from '../../../shared/constants/title.constant';
import { StudentSubjectList } from './list/student-subject-list';

export const STUDENT_SUBJECT_ROUTES: Route[] = [
  {
    path: '',
    component: StudentSubjectList,
    title: GetPageTitle(TITLES.STUDENT.MY_SUBJECTS),
  },
];

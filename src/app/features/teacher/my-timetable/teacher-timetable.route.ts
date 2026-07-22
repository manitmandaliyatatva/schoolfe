import { Route } from '@angular/router';
import { authGuard } from '../../../core/guards/auth-guard';
import { GetPageTitle, TITLES } from '../../../shared/constants/title.constant';
import { TeacherTimetableComponent } from './list/teacher-timetable';

export const TEACHER_TIMETABLE_ROUTES: Route[] = [
  {
    path: '',
    component: TeacherTimetableComponent,
    canActivate: [authGuard],
    data: { myTimetable: true },
    title: GetPageTitle(TITLES.TEACHER.MY_TIMETABLE),
  },
];


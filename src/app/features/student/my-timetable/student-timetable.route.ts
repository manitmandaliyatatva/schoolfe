import { Route } from '@angular/router';
import { GetPageTitle, TITLES } from '../../../shared/constants/title.constant';
import { StudentClassroomTimetableComponent } from './list/classroom-timetable';

export const STUDENT_TIMETABLE_ROUTES: Route[] = [
  {
    path: '',
    component: StudentClassroomTimetableComponent,
    data: { myTimetable: true },
    title: GetPageTitle(TITLES.STUDENT.MY_TIMETABLE),
  },
];

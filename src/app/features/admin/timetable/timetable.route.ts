import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { Route } from '@angular/router';
import { authGuard } from '../../../core/guards/auth-guard';
import { ADMIN_ROUTE } from '../../../shared/constants/route.constant';
import { GetPageTitle, TITLES } from '../../../shared/constants/title.constant';
import { ClassroomTimetableComponent } from './classroom-timetable/list/classroom-timetable';
import { TeacherTimetableComponent } from './teacher-timetable/list/teacher-timetable';
import { TimeslotForm } from './time-slot/form/timeslot-form';
import { TimeslotComponent } from './time-slot/list/timeslot';
import { Timetable } from './timetable';

export const TIMETABLE_ROUTES: Route[] = [
  {
    path: '',
    component: Timetable,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: ADMIN_ROUTE.TIMETABLE.TIME_SLOTS,
      },
      {
        path: ADMIN_ROUTE.TIMETABLE.TEACHER_TIMETABLES,
        component: TeacherTimetableComponent,
        title: GetPageTitle(TITLES.ADMIN.TEACHER_TIMETABLE),
      },
      {
        path: ADMIN_ROUTE.TIMETABLE.CLASSROOM_TIMETABLES,
        component: ClassroomTimetableComponent,
        title: GetPageTitle(TITLES.ADMIN.CLASSROOM_TIMETABLE),
      },
      {
        path: ADMIN_ROUTE.TIMETABLE.TIME_SLOTS,
        component: TimeslotComponent,
        title: GetPageTitle(TITLES.ADMIN.TIME_SLOT),
      },
      {
        path: `${ADMIN_ROUTE.TIMETABLE.TIME_SLOTS}/add`,
        component: TimeslotForm,
        title: GetPageTitle(TITLES.ADMIN.TIME_SLOT),
      //canDeactivate: [pendingChangesGuard],
                },
      {
        path: `${ADMIN_ROUTE.TIMETABLE.TIME_SLOTS}/edit/:timeSlotId`,
        component: TimeslotForm,
        title: GetPageTitle(TITLES.ADMIN.TIME_SLOT),
      //canDeactivate: [pendingChangesGuard],
                },
    ],
  },
];

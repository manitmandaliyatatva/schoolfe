import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { Route } from '@angular/router';
import { SubjectAllocation } from './subject-allocation/list/subject-allocation';
import { SubjectAllocationForm } from './subject-allocation/form/subject-allocation-form';
import { Classes } from './classes';
import { authGuard } from '../../../core/guards/auth-guard';
import { ADMIN_ROUTE, CLASS_ROUTE } from '../../../shared/constants/route.constant';
import { GetPageTitle, TITLES } from '../../../shared/constants/title.constant';

export const CLASSES_ROUTES: Route[] = [
  {
    path: '',
    component: Classes,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: ADMIN_ROUTE.CONFIGURATION.SECTION,
      },
      {
        path: CLASS_ROUTE.SUBJECT_ALLOCATION,
        component: SubjectAllocation,
        title: GetPageTitle(TITLES.SUBJECT_ALLOCATION),
      },
      {
        path: CLASS_ROUTE.SUBJECT_ALLOCATION_ADD,
        component: SubjectAllocationForm,
        title: GetPageTitle(TITLES.SUBJECT_ALLOCATION),
        //canDeactivate: [pendingChangesGuard],
      },
      {
        path: CLASS_ROUTE.SUBJECT_ALLOCATION_EDIT,
        component: SubjectAllocationForm,
        title: GetPageTitle(TITLES.SUBJECT_ALLOCATION),
        //canDeactivate: [pendingChangesGuard],
      },
    ],
  },
];

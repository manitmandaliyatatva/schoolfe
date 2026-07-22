import { Routes } from '@angular/router';
import { PUBLIC_ROUTE } from './shared/constants/route.constant';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/layouts/public-layout/public-layout').then(m => m.PublicLayoutComponent),
    loadChildren: () => import('./features/public/public.routes').then(m => m.PUBLIC_WEBSITE_ROUTES)
  },
  {
    path: 'admin',
    loadChildren: () => import('../app/features/admin/admin.route').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'student',
    loadChildren: () => import('../app/features/student/student.route').then(m => m.STUDENT_ROUTE)
  },
  {
    path: 'teacher',
    loadChildren: () => import('./features/teacher/teacher.route').then(m => m.TEACHER_ROUTE)
  },
  {
    path: '',
    loadChildren: () => import('../app/features/auth/auth-routes').then(m => m.PUBLIC_ROUTES)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('../app/features/unauthorized/unauthorized').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    redirectTo: '',
  },
];
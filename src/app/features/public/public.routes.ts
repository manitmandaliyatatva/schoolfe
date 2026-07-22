import { Routes } from '@angular/router';

export const PUBLIC_WEBSITE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.Home)
  },
  {
    path: 'features',
    loadComponent: () => import('./features/features').then(m => m.Features)
  },
  {
    path: 'news',
    loadComponent: () => import('./news/news').then(m => m.News)
  },
  {
    path: 'news/:newsId',
    loadComponent: () => import('./news-detail/news-detail').then(m => m.NewsDetail)
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about').then(m => m.About)
  },
  {
    path: 'become-teacher',
    loadComponent: () => import('./become-teacher/become-teacher').then(m => m.BecomeTeacher)
  },
  {
    path: 'contact',
    loadComponent: () => import('./contact/contact').then(m => m.Contact)
  }
];

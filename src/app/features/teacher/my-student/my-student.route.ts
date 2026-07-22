import { Route } from "@angular/router";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";

export const TEACHER_MY_STUDENT_ROUTES: Route[] = [
    {
        path: '',
        loadComponent: () => import('./list/my-student').then(m => m.MyStudentComponent),
        title: GetPageTitle(TITLES.USER.STUDENT),
    },
    {
        path: 'view/:studentId',
        loadComponent: () => import('./view/student-view').then(m => m.StudentViewWrapper),
        title: GetPageTitle(TITLES.USER.STUDENT),
    }
]

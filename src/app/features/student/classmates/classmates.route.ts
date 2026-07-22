import { Route } from "@angular/router";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";

export const STUDENT_CLASSMATES_ROUTES: Route[] = [
    {
        path: '',
        loadComponent: () => import('./list/classmates').then(m => m.ClassmatesComponent),
        title: GetPageTitle(TITLES.STUDENT.CLASSMATES),
    },
]

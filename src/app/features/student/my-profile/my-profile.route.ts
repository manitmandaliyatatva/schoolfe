import { Route } from "@angular/router";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";

export const STUDENT_PROFILE_ROUTES: Route[] = [
    {
        path: '',
        loadComponent: () => import('./view/my-profile').then(m => m.MyProfileComponent),
        data: { myProfile: true },
        title: GetPageTitle(TITLES.ADMIN.PROFILE),
    }
]

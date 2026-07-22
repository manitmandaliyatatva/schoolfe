import { Route } from "@angular/router";
import { publicGuard } from "../../core/guards/auth-guard";
import { AuthLayout } from "../../core/layouts/auth-layout/auth-layout";
import { LOGIN_CONST } from "./auth.model";
import { ForgetPassword } from "./forget-password/forget-password";
import { Login } from "./login/login";
import { ResetPassword } from "./reset-password/reset-password";

export const PUBLIC_ROUTES: Route[] = [
    {
        path: '',
        component: AuthLayout,
        children: [
            { path: '', redirectTo: 'login', pathMatch: 'full' },
            { path: 'login', component: Login, pathMatch: 'full', title: LOGIN_CONST.LOG_IN, canActivate: [publicGuard] },
            { path: 'forget-password', component: ForgetPassword, pathMatch: 'full', title: LOGIN_CONST.FORGET_PASSWORD, canActivate: [publicGuard] },
            { path: 'reset-password', component: ResetPassword, pathMatch: 'full', title: LOGIN_CONST.RESET_PASSWORD, canActivate: [publicGuard] }]
    }
];
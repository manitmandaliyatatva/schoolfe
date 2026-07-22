import { Route } from "@angular/router";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";

export const STUDENT_FEE_ROUTES: Route[] = [
    {
        path: 'student-fees',
        loadComponent: () => import('./list/student-fee').then(m => m.StudentFee),
        title: GetPageTitle(TITLES.FEE.STUDENT_FEE),
    },
    {
        path: 'payment-history',
        loadComponent: () => import('../../admin/fee/payment-history/history/student-payment-history').then(m => m.StudentPaymentHistory),
        title: GetPageTitle(TITLES.FEE.PAYMENT_HISTORY),
    },
]

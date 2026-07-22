import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { Route } from "@angular/router";
import { Fee } from "./fee";
import { authGuard } from "../../../core/guards/auth-guard";
import { ADMIN_ROUTE } from "../../../shared/constants/route.constant";
import { FeeTypeForm } from "./fee-type/form/fee-type-form";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";
import { FeeStructureForm } from "./fee-structure/form/fee-structure-form";
import { FeeStructureList } from "./fee-structure/list/fee-structure-list";
import { FeeTypeList } from "./fee-type/list/fee-type-list";
import { StudentFeeForm } from "./student-fee/form/student-fee-form";
import { StudentFeeList } from "./student-fee/list/student-fee-list";
import { LateFeeForm } from "./late-fee/components/late-fee-form/late-fee-form";
import { LateFeeList } from "./late-fee/components/late-fee-list/late-fee-list";
import { FeeAdjustmentForm } from "./fee-adjustment/fee-adjustment-form/fee-adjustment-form";
import { FeeAdjustmentList } from "./fee-adjustment/fee-adjustment-list/fee-adjustment-list";
import { PaymentHistoryList } from "./payment-history/list/payment-history-list";
import { StudentPaymentHistory } from "./payment-history/history/student-payment-history";

export const FEE_ROUTE: Route[] = [
    {
        path: '',
        component: Fee,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: ADMIN_ROUTE.FEE.FEE_TYPE.LIST,
            },
            {
                path: ADMIN_ROUTE.FEE.FEE_TYPE.ADD,
                component: FeeTypeForm,
                title: GetPageTitle(TITLES.FEE.FEE_TYPE),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.FEE.FEE_TYPE.EDIT,
                component: FeeTypeForm,
                title: GetPageTitle(TITLES.FEE.FEE_TYPE),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.FEE.FEE_TYPE.LIST,
                component: FeeTypeList,
                title: GetPageTitle(TITLES.FEE.FEE_TYPE),
            },
            //Fee Structure
            {
                path: ADMIN_ROUTE.FEE.FEE_STRUCTURE.ADD,
                component: FeeStructureForm,
                title: GetPageTitle(TITLES.FEE.FEE_STRUCTURE),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.FEE.FEE_STRUCTURE.EDIT,
                component: FeeStructureForm,
                title: GetPageTitle(TITLES.FEE.FEE_STRUCTURE),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.FEE.FEE_STRUCTURE.LIST,
                component: FeeStructureList,
                title: GetPageTitle(TITLES.FEE.FEE_STRUCTURE),
            },
            //Student Fee
            {
                path: ADMIN_ROUTE.FEE.STUDENT_FEE.EDIT,
                component: StudentFeeForm,
                title: GetPageTitle(TITLES.FEE.STUDENT_FEE),
            },
            {
                path: ADMIN_ROUTE.FEE.STUDENT_FEE.LIST,
                component: StudentFeeList,
                title: GetPageTitle(TITLES.FEE.STUDENT_FEE),
            },
            //Late Fee
            {
                path: ADMIN_ROUTE.FEE.LATE_FEE.ADD,
                component: LateFeeForm,
                title: GetPageTitle(TITLES.FEE.LATE_FEE),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.FEE.LATE_FEE.EDIT,
                component: LateFeeForm,
                title: GetPageTitle(TITLES.FEE.LATE_FEE),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.FEE.LATE_FEE.LIST,
                component: LateFeeList,
                title: GetPageTitle(TITLES.FEE.LATE_FEE),
            },
            //Fee Adjustment
            {
                path: ADMIN_ROUTE.FEE.FEE_ADJUSTMENT.ADD,
                component: FeeAdjustmentForm,
                title: GetPageTitle(TITLES.FEE.FEE_ADJUSTMENT),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.FEE.FEE_ADJUSTMENT.EDIT,
                component: FeeAdjustmentForm,
                title: GetPageTitle(TITLES.FEE.FEE_ADJUSTMENT),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.FEE.FEE_ADJUSTMENT.LIST,
                component: FeeAdjustmentList,
                title: GetPageTitle(TITLES.FEE.FEE_ADJUSTMENT),
            },
            //Payment History
            {
                path: ADMIN_ROUTE.FEE.PAYMENT_HISTORY.LIST,
                component: PaymentHistoryList,
                title: GetPageTitle(TITLES.FEE.PAYMENT_HISTORY),
            },
            {
                path: ADMIN_ROUTE.FEE.PAYMENT_HISTORY.HISTORY,
                component: StudentPaymentHistory,
                title: GetPageTitle(TITLES.FEE.PAYMENT_HISTORY),
            },
        ],
    },
]
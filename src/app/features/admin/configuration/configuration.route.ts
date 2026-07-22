import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { Route } from "@angular/router";
import { Configuration } from "./configuration";
import { StudentCategoryComponent } from "./student-category/list/student-category";
import { StudentCategoryForm } from "./student-category/form/student-category-form";
import { authGuard } from "../../../core/guards/auth-guard";
import { ADMIN_ROUTE } from "../../../shared/constants/route.constant";
import { GetPageTitle, TITLES } from "../../../shared/constants/title.constant";
import { ClassForm } from "./class-page/form/class-form";
import { ClassPage } from "./class-page/list/class-page";
import { SectionForm } from "./section/form/section-form";
import { Section } from "./section/list/section";
import { SubjectForm } from "./subject/form/subject-form";
import { Subject } from "./subject/list/subject";
import { DocumentTypeComponent } from "./document-type/list/document-type";
import { DocumentTypeForm } from "./document-type/form/document-type-form";
import { ClassroomComponent } from "./classroom/list/classroom";
import { ClassroomForm } from "./classroom/form/classroom-form";
import { AcademicYearForm } from "./academic-year/form/academic-year-form";
import { AcademicYearComponent } from "./academic-year/list/academic-year";
import { ClassSubjectForm } from "./class-subject/form/class-subject-form";
import { ClassSubjectComponent } from "./class-subject/list/class-subject";
import { AttendenceStatusList } from "./attendence-status/list/attendence-status-list";
import { AttendenceStatusForm } from "./attendence-status/form/attendence-status-form";
import { HolidayComponent } from "./holiday/list/holiday";
import { HolidayForm } from "./holiday/form/holiday-form";
import { SpecialDayOverrideComponent } from "./special-day-override/list/special-day-override";
import { SpecialDayOverrideForm } from "./special-day-override/form/special-day-override-form";
import { WeekoffSettingComponent } from "./weekoff-settings/weekoff-setting";
import { BranchListComponent } from "./branch/branch-list/branch-list";
import { BranchFormComponent } from "./branch/form/branch-form";

export const CONFIGURATION_ROUTES: Route[] = [
    {
        path: '',
        component: Configuration,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: ADMIN_ROUTE.CONFIGURATION.CLASS,
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.DOCUMENT_TYPES,
                component: DocumentTypeComponent,
                title: GetPageTitle(TITLES.CONFIGURATION.DOCUMENT_TYPE),
            },
            {
                path: `${ADMIN_ROUTE.CONFIGURATION.DOCUMENT_TYPES}/add`,
                component: DocumentTypeForm,
                title: GetPageTitle(TITLES.CONFIGURATION.DOCUMENT_TYPE),
                    //canDeactivate: [pendingChangesGuard],
            },
            {
                path: `${ADMIN_ROUTE.CONFIGURATION.DOCUMENT_TYPES}/edit/:documentTypeId`,
                component: DocumentTypeForm,
                title: GetPageTitle(TITLES.CONFIGURATION.DOCUMENT_TYPE),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.STUDENT_CATEGORIES,
                component: StudentCategoryComponent,
                title: GetPageTitle(TITLES.CONFIGURATION.STUDENT_CATEGORY),
            },
            {
                path: `${ADMIN_ROUTE.CONFIGURATION.STUDENT_CATEGORIES}/add`,
                component: StudentCategoryForm,
                title: GetPageTitle(TITLES.CONFIGURATION.STUDENT_CATEGORY),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: `${ADMIN_ROUTE.CONFIGURATION.STUDENT_CATEGORIES}/edit/:categoryId`,
                component: StudentCategoryForm,
                title: GetPageTitle(TITLES.CONFIGURATION.STUDENT_CATEGORY),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.ACADEMIC_YEARS,
                component: AcademicYearComponent,
                title: GetPageTitle(TITLES.ADMIN.ACADEMIC_YEAR),
            },
            {
                path: `${ADMIN_ROUTE.CONFIGURATION.ACADEMIC_YEARS}/add`,
                component: AcademicYearForm,
                title: GetPageTitle(TITLES.ADMIN.ACADEMIC_YEAR),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: `${ADMIN_ROUTE.CONFIGURATION.ACADEMIC_YEARS}/edit/:academicYearId`,
                component: AcademicYearForm,
                title: GetPageTitle(TITLES.ADMIN.ACADEMIC_YEAR),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.CLASSROOMS,
                component: ClassroomComponent,
                title: GetPageTitle(TITLES.ADMIN.CLASSROOM),
            },
            {
                path: `${ADMIN_ROUTE.CONFIGURATION.CLASSROOMS}/add`,
                component: ClassroomForm,
                title: GetPageTitle(TITLES.ADMIN.CLASSROOM),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: `${ADMIN_ROUTE.CONFIGURATION.CLASSROOMS}/edit/:classSectionId`,
                component: ClassroomForm,
                title: GetPageTitle(TITLES.ADMIN.CLASSROOM),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.CLASS_SUBJECTS,
                component: ClassSubjectComponent,
                title: GetPageTitle(TITLES.ADMIN.CLASS_SUBJECT),
            },
            {
                path: `${ADMIN_ROUTE.CONFIGURATION.CLASS_SUBJECTS}/add`,
                component: ClassSubjectForm,
                title: GetPageTitle(TITLES.ADMIN.CLASS_SUBJECT),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: `${ADMIN_ROUTE.CONFIGURATION.CLASS_SUBJECTS}/edit/:classSubjectId`,
                component: ClassSubjectForm,
                title: GetPageTitle(TITLES.ADMIN.CLASS_SUBJECT),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.SECTION,
                component: Section,
                title: GetPageTitle(TITLES.SECTION),
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.SECTION_ADD,
                component: SectionForm,
                title: GetPageTitle(TITLES.SECTION),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.SECTION_EDIT,
                component: SectionForm,
                title: GetPageTitle(TITLES.SECTION),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.SUBJECT,
                component: Subject,
                title: GetPageTitle(TITLES.SUBJECT),
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.SUBJECT_ADD,
                component: SubjectForm,
                title: GetPageTitle(TITLES.SUBJECT),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.SUBJECT_EDIT,
                component: SubjectForm,
                title: GetPageTitle(TITLES.SUBJECT),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.CLASS,
                component: ClassPage,
                title: GetPageTitle(TITLES.CLASS),
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.CLASS_ADD,
                component: ClassForm,
                title: GetPageTitle(TITLES.CLASS),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.CLASS_EDIT,
                component: ClassForm,
                title: GetPageTitle(TITLES.CLASS),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.ATTENDENCE_STATUS.LIST,
                component: AttendenceStatusList,
                title: GetPageTitle(TITLES.ADMIN.ATTENDENCE_STATUS),
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.ATTENDENCE_STATUS.ADD,
                component: AttendenceStatusForm,
                title: GetPageTitle(TITLES.ADMIN.ATTENDENCE_STATUS),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.ATTENDENCE_STATUS.EDIT,
                component: AttendenceStatusForm,
                title: GetPageTitle(TITLES.ADMIN.ATTENDENCE_STATUS),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.WEEKOFFS,
                component: WeekoffSettingComponent,
                title: GetPageTitle(TITLES.CONFIGURATION.WEEKOFFS),
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.HOLIDAY.LIST,
                component: HolidayComponent,
                title: GetPageTitle(TITLES.ADMIN.HOLIDAY),
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.HOLIDAY.ADD,
                component: HolidayForm,
                title: GetPageTitle(TITLES.ADMIN.HOLIDAY),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.HOLIDAY.EDIT,
                component: HolidayForm,
                title: GetPageTitle(TITLES.ADMIN.HOLIDAY),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.SPECIAL_DAY_OVERRIDE.LIST,
                component: SpecialDayOverrideComponent,
                title: GetPageTitle(TITLES.ADMIN.SPECIAL_DAY_OVERRIDE),
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.SPECIAL_DAY_OVERRIDE.ADD,
                component: SpecialDayOverrideForm,
                title: GetPageTitle(TITLES.ADMIN.SPECIAL_DAY_OVERRIDE),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.SPECIAL_DAY_OVERRIDE.EDIT,
                component: SpecialDayOverrideForm,
                title: GetPageTitle(TITLES.ADMIN.SPECIAL_DAY_OVERRIDE),
                //canDeactivate: [pendingChangesGuard],
            },
            // Branch
            {
                // TODO: Need to decide after Super Admin
                path: ADMIN_ROUTE.CONFIGURATION.BRANCH.LIST,
                component: BranchListComponent,
                title: GetPageTitle(TITLES.SUPER_ADMIN.BRANCH),
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.BRANCH.ADD,
                component: BranchFormComponent,
                title: GetPageTitle(TITLES.SUPER_ADMIN.BRANCH),
                //canDeactivate: [pendingChangesGuard],
            },
            {
                path: ADMIN_ROUTE.CONFIGURATION.BRANCH.EDIT,
                component: BranchFormComponent,
                title: GetPageTitle(TITLES.SUPER_ADMIN.BRANCH),
                //canDeactivate: [pendingChangesGuard],
            },
        ],
    },
]

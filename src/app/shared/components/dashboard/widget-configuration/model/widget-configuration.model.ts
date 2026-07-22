import { createGenericStore } from "../../../../../core/store/resource.store";

export interface WidgetConfigItem<T = DashboardWidgetsVisibility> {
    key: keyof T;
    label: string;
    icon: string;
}

export interface WidgetConfig {
    dashboardConfig: string;
    globalConfig?: string;
}

// #region Admin Dashboard Visibility
export interface AdminDashboardVisibility {
    adminStudentAttendance: boolean;
    adminTeacherAttendance: boolean;
    adminEvents: boolean;
    adminExams: boolean;
    adminNotices: boolean;
    adminBirthdays: boolean;
    adminHoliday: boolean;
}

export const AdminDashboardWidgets: WidgetConfigItem<AdminDashboardVisibility>[] = [
    { key: 'adminStudentAttendance', label: 'Student Attendance', icon: 'analytics' },
    { key: 'adminTeacherAttendance', label: 'Teacher Attendance', icon: 'bar_chart' },
    { key: 'adminEvents', label: 'Upcoming Events', icon: 'event' },
    { key: 'adminExams', label: 'Upcoming Exams', icon: 'assignment' },
    { key: 'adminNotices', label: 'Recent Notices', icon: 'campaign' },
    { key: 'adminBirthdays', label: 'Today\'s Birthdays', icon: 'cake' },
    { key: 'adminHoliday', label: 'School Holidays', icon: 'beach_access' }
];

export const defaultAdminVisibility: AdminDashboardVisibility = {
    adminStudentAttendance: true,
    adminTeacherAttendance: true,
    adminEvents: true,
    adminExams: true,
    adminNotices: true,
    adminBirthdays: true,
    adminHoliday: true
};

// #endregion

// #region Teacher Dashboard Visibility
export interface TeacherDashboardVisibility {
    teacherAttendance: boolean;
    teacherStudentAttendance: boolean;
    teacherTimetable: boolean;
    teacherHomeworks: boolean;
    teacherExams: boolean;
    teacherEvents: boolean;
    teacherNotices: boolean;
    teacherBirthdays: boolean;
    teacherHoliday: boolean;
}

export const TeacherDashboardWidgets: WidgetConfigItem<TeacherDashboardVisibility>[] = [
    { key: 'teacherAttendance', label: 'My Attendance', icon: 'donut_large' },
    { key: 'teacherStudentAttendance', label: 'Students Attendance', icon: 'groups' },
    { key: 'teacherTimetable', label: 'Timetable', icon: 'schedule' },
    { key: 'teacherEvents', label: 'Upcoming Events', icon: 'event' },
    { key: 'teacherNotices', label: 'Recent Notices', icon: 'campaign' },
    { key: 'teacherBirthdays', label: 'Today\'s Birthdays', icon: 'cake' },
    { key: 'teacherHoliday', label: 'School Holidays', icon: 'beach_access' },
    { key: 'teacherExams', label: 'Recent Exams', icon: 'assignment' },
    { key: 'teacherHomeworks', label: 'Recent Homeworks', icon: 'menu_book' },
];

export const defaultTeacherVisibility: TeacherDashboardVisibility = {
    teacherAttendance: true,
    teacherStudentAttendance: true,
    teacherTimetable: true,
    teacherHomeworks: true,
    teacherExams: true,
    teacherEvents: true,
    teacherNotices: true,
    teacherBirthdays: true,
    teacherHoliday: true
};

// #endregion

// #region Student Dashboard Visibility
export interface StudentDashboardVisibility {
    studentAttendance: boolean;
    studentTimetable: boolean;
    studentHomeworks: boolean;
    studentExams: boolean;
    studentEvents: boolean;
    studentNotices: boolean;
    studentBirthdays: boolean;
    studentHoliday: boolean;
}

export const StudentDashboardWidgets: WidgetConfigItem<StudentDashboardVisibility>[] = [
    { key: 'studentAttendance', label: 'My Attendance', icon: 'donut_large' },
    { key: 'studentHomeworks', label: 'Recent Homeworks', icon: 'menu_book' },
    { key: 'studentTimetable', label: 'Timetable', icon: 'schedule' },
    { key: 'studentEvents', label: 'Upcoming Events', icon: 'event' },
    { key: 'studentNotices', label: 'Recent Notices', icon: 'campaign' },
    { key: 'studentBirthdays', label: 'Today\'s Birthdays', icon: 'cake' },
    { key: 'studentHoliday', label: 'School Holidays', icon: 'beach_access' },
    { key: 'studentExams', label: 'Upcoming Exams', icon: 'assignment' },
];

export const defaultStudentVisibility: StudentDashboardVisibility = {
    studentAttendance: true,
    studentTimetable: true,
    studentHomeworks: true,
    studentExams: true,
    studentEvents: true,
    studentNotices: true,
    studentBirthdays: true,
    studentHoliday: true
};
// #endregion

export interface DashboardWidgetsVisibility extends AdminDashboardVisibility, TeacherDashboardVisibility, StudentDashboardVisibility { }

export const defaultDashboardVisibility: DashboardWidgetsVisibility = {
    ...defaultAdminVisibility,
    ...defaultTeacherVisibility,
    ...defaultStudentVisibility
};

export const WIDGET_CONFIG_CONST = {
    CONFIGURE_WIDGETS: 'Configure Widgets',
    DIALOG_SUBTITLE: 'Personalize your dashboard layout by choosing which widgets are visible.'
};

export const GenericWidgetStore = createGenericStore<WidgetConfig>();
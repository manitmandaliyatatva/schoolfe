export const TITLES = {
  PROJECT_NAME: 'SIKSHA HUB',
  LOGIN: 'Login',
  FORGOT_PASSWORD: 'Reset Password',
  CONFIGURATION: {
    ADMIN_CONFIGURATION: 'Configuration',
    DOCUMENT_TYPE: 'Document Type',
    STUDENT_CATEGORY: 'Student Category',
    WEEKOFFS: "Weekoffs",
  },
  FEE: {
    FEE_STRUCTURE: "Fee Structure",
    FEE_TYPE: "Fee Type",
    STUDENT_FEE: "Student Fee",
    LATE_FEE: "Late Fee",
    FEE_ADJUSTMENT: "Fee Adjustment",
    PAYMENT_HISTORY: "Payment History",
  },

  COMMUNICATION: {
    NOTICE_TYPE: "Notice Type",
    NOTICE_AUDIANCE_TYPE: "Notice Audiance Type",
    NOTICE: "Notice",
    NOTICE_AUDIENCE_GROUP: "Notice Audience Group"
  },

  ADMIN: {
    ADMIN: 'Admin',
    DASHBOARD: 'Admin Dashboard',
    NOTICES: 'Notices',
    PROFILE: 'Profile',
    CLASS_SUBJECT: 'Class Subject',
    CLASSROOM: 'Classroom',
    ACADEMIC_YEAR: 'Academic Year',
    EXAM_TYPE: 'Exam Type',
    EXAMS: 'Exams',
    EXAM_GROUP: 'Exam',
    VIEW_EXAM_GROUP: 'Exam Details',
    EXAM_GROUP_MARKS: 'Exam Marks',
    TIME_SLOT: 'Time Slot',
    TEACHER_TIMETABLE: 'Teacher Timetable',
    CLASSROOM_TIMETABLE: 'Classroom Timetable',
    MARKS: 'Marks',
    HOMEWORK_REVIEW: 'Review',
    ATTENDENCE_STATUS: 'Attendance Status',
    EVENTS: 'Events',
    EVENT_TYPE: 'Event Type',
    CALENDAR: 'Calendar',
    HOLIDAY: 'Holiday',
    SPECIAL_DAY_OVERRIDE: 'Special Day Override',
  },
  USER: {
    USERS: 'User',
    ROLE: 'Role',
    ADMIN_USER: 'User',
    STUDENT: 'Student',
    ADMIN_ROLE: 'Role',
    DOCUMENT_TYPE: 'Document Type',
    STUDENT_CATEGORY: 'Student Category',
    TEACHER: 'Teacher',
    VIEW_TEACHER: 'Teacher Details',
    VIEW_STUDENT: 'Student Details',
    ROLE_PERMISSIONS: 'Role Permissions',
    PERMISSION: 'Permission',
    PAGES: 'Pages',
    DASHBOARD_PERMISSION: 'Dashboard Permission'
  },
  COMMON: {
    LOGIN: 'Login',
    FORGOT_PASSWORD: 'Reset Password',
  },
  TEACHER: {
    DASHBOARD: 'Teacher Dashboard',
    MY_TIMETABLE: 'My Timetable',
    EXAMS: 'Exams',
    MY_STUDENTS: 'My Student',
  },
  STUDENT: {
    STUDENT_LIST: 'Student List',
    DASHBOARD: 'Student Dashboard',
    MY_TIMETABLE: 'My Timetable',
    MY_ATTENDENCE: 'My Attendance',
    MY_RESULTS: 'My Results',
    HOMEWORKS: 'Homework',
    MY_SUBJECTS: 'My Subjects',
    EXAMS: 'Exams',
    CLASSMATES: 'Classmates',
  },
  SECTION: 'Section',
  SUBJECT: 'Subject',
  CLASS: 'Class',
  SUBJECT_ALLOCATION: 'Subject Allocation',
  HOMEWORK: 'Homework',
  ATTENDANCE: {
    STUDENT_ATTAENDANCE: "Student Attendance",
    TEACHER_ATTAENDANCE: "Teacher Attendance",
    VIEW_TEACHER_ATTENDANCE: "View Teacher Attendance",
    TEACHER_MONTHLY_REPORT: "Teacher Attendance Monthly Report",
    STUDENT_MONTHLY_REPORT: "Student Attendance Monthly Report",
  },
  SUPER_ADMIN: {
    BRANCH: 'Branch',
  }
};

export const MANAGEMENT_TITLE = 'Management';

export function GetPageTitle(title: string): string {
  return `${TITLES.PROJECT_NAME} | ${title}`;
}

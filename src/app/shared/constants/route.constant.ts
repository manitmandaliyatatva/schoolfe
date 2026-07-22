export const PUBLIC_ROUTE = {
  LOGIN: 'login',
  FORGOT_PASSWORD: 'forgot-password',
};

export const ADMIN_ROUTE = {
  ADMIN: 'admin',
  DASHBOARD: 'dashboard',
  DASHBOARD_V2: 'dashboard-v2',
  USER: {
    USERS: 'users',
    STUDENTS: 'students',
    ROLES: 'roles',
    TEACHERS: 'teachers',
    ROLE_PERMISSIONS: 'role-permission',
    PERMISSIONS: 'permission',
    PAGES: 'pages',
    DASHBOARD_PERMISSION: 'dashboard-permission'
  },
  TIMETABLE: {
    TIMETABLE: 'timetable',
    TIME_SLOTS: 'time-slots',
    TEACHER_TIMETABLES: 'teacher-timetables',
    CLASSROOM_TIMETABLES: 'classroom-timetables',
  },
  FEE: {
    FEE_TYPE: {
      LIST: 'fee-types',
      ADD: 'fee-types/add',
      EDIT: 'fee-types/edit/:feeTypeId',
    },
    FEE_STRUCTURE: {
      LIST: 'fee-structures',
      ADD: 'fee-structures/add',
      EDIT: 'fee-structures/edit/:feeStructureId'
    },
    STUDENT_FEE: {
      LIST: 'student-fees',
      EDIT: 'student-fees/edit/:feeStudentId'
    },
    LATE_FEE: {
      LIST: 'late-fees',
      ADD: 'late-fees/add',
      EDIT: 'late-fees/edit/:lateFeeConfigId',
    },
    FEE_ADJUSTMENT: {
      LIST: 'fee-adjustments',
      ADD: 'fee-adjustments/add',
      EDIT: 'fee-adjustments/edit/:feeAdjustmentId',
    },
    PAYMENT_HISTORY: {
      LIST: 'payment-history',
      HISTORY: 'payment-history/history/:studentId',
    }
  },
  CONFIGURATION: {
    CONFIGURATION: 'configuration',
    DOCUMENT_TYPES: 'document-types',
    STUDENT_CATEGORIES: 'student-categories',
    ACADEMIC_YEARS: 'academic-years',
    CLASSROOMS: 'classrooms',
    CLASS_SUBJECTS: 'class-subjects',
    SECTION: 'sections',
    SECTION_ADD: 'sections/add',
    SECTION_EDIT: 'sections/edit/:id',
    SUBJECT: 'subjects',
    SUBJECT_ADD: 'subjects/add',
    SUBJECT_EDIT: 'subjects/edit/:id',
    CLASS: 'classes',
    CLASS_ADD: 'classes/add',
    CLASS_EDIT: 'classes/edit/:id',
    ATTENDENCE_STATUS: {
      LIST: "attendance-statuses",
      ADD: "attendance-statuses/add",
      EDIT: "attendance-statuses/edit/:attendanceStatusId"
    },
    HOLIDAY: {
      LIST: "holidays",
      ADD: "holidays/add",
      EDIT: "holidays/edit/:holidayId"
    },
    SPECIAL_DAY_OVERRIDE: {
      LIST: "special-day-override",
      ADD: "special-day-override/add",
      EDIT: "special-day-override/edit/:specialDayOverrideId"
    },
    WEEKOFFS: "weekoff-setting",
    BRANCH: {
      LIST: "branches",
      ADD: "branches/add",
      EDIT: "branches/edit/:branchId"
    },
  },
  COMMUNICATION: {
    NOTICE_TYPE: "notice-types",
    ADD_NOTICE_TYPE: "notice-types/add",
    EDIT_NOTICE_TYPE: "notice-types/edit/:id",

    NOTICE_AUDIENCE_TYPE: "notice-audience-types",
    ADD_NOTICE_AUDIENCE_TYPE: "notice-audience-types/add",
    EDIT_NOTICE_AUDIENCE_TYPE: "notice-audience-types/edit/:id",

    NOTICE: "my-notices",
    ADD_NOTICE: "my-notices/add",
    EDIT_NOTICE: "my-notices/edit/:noticeId",

    NOTICE_AUDIENCE_GROUP: "notice-audience-groups",
    ADD_NOTICE_AUDIENCE_GROUP: "notice-audience-groups/add",
    EDIT_NOTICE_AUDIENCE_GROUP: "notice-audience-groups/edit/:noticeGroupId",
  },
  HOMEWORK: {
    HOMEWORK: 'homework',
    LIST: 'homeworks',
    ADD: 'homeworks/add',
    EDIT: 'homeworks/edit/:homeworkId',
    REVIEWS: 'reviews',
    REVIEW_VIEW: 'reviews/view/:id',
    REVIEW_EDIT: 'reviews/edit/:id',
  },
  EXAMINATION: {
    EXAMINATION: 'examination',
    EXAM_TYPES: 'exam-types',
    EXAMTYPE_ADD: 'exam-types/add',
    EXAMTYPE_EDIT: 'exam-types/edit/:examTypeId',
    EXAMS: 'exams',
    EXAMS_ADD: 'exams/add',
    EXAMS_EDIT: 'exams/edit/:examGroupId',
    MARKS: 'marks',
    MARKS_VIEW: 'marks/view/:examGroupId',
    MARKS_EDIT: 'marks/edit/:examGroupId',
  },
  TEACHAR_ATTENDANCE: {
    ADD: 'take-student-attendance',
    LIST: 'view-attendance',
    MY_ATTENDANCE: 'my-attendance'
  },
  ATTENDANCE: {
    TEACHER: 'teacher-attendances',
    STUDENT: 'student-attendances',
    VIEW_TEACHER: 'view-teacher-attendances',
    TEACHER_MONTHLY_REPORT: 'teacher-attendance-monthly-report',
    STUDENT_MONTHLY_REPORT: 'student-attendance-monthly-report'
  },
  SITE_CONFIGURATION : {
    CAROUSEL : {
      ADD : 'carousel/add',
      LIST : 'carousel',
      EDIT : 'carousel/edit/:carouselId'
    },
    TESTIMONIAL : {
      ADD : 'testimonials/add',
      LIST : 'testimonials',
      EDIT : 'testimonials/edit/:testimonialId'
    },
    NEWS_ANNOUNCEMENT : {
      ADD : 'news-announcement/add',
      LIST : 'news-announcement',
      EDIT : 'news-announcement/edit/:newsId'
    },
    FACILITY : {
      ADD : 'facility/add',
      LIST : 'facility',
      EDIT : 'facility/edit/:id'
    },
    CONTACTUS : 'contactus',
    META_INFORMATION_ADD : 'meta-information',
    META_INFORMATION_EDIT : 'meta-information/edit/:metaInformationId',

  },
}

export const CLASS_ROUTE = {
  SUBJECT_ALLOCATION: 'subject-allocation',
  SUBJECT_ALLOCATION_ADD: 'subject-allocation/add',
  SUBJECT_ALLOCATION_EDIT: 'subject-allocation/edit/:id',
};

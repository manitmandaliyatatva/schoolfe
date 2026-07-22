import { DropdownOption } from "../../shared/models/Dropdown.model";

export const SYSTEM_CONST = {
    CURRENCY_ICON: '$',
    /**
     * System & API Errors
     */
    ERRORS: {
        UNAUTHORIZED: {
            TITLE: "🚫 Unauthorized Access",
            DETAILS: "You don't have permission to view this page.",
            NO_ROLE: "Unauthorized or no roles assigned.",
        },
        NOT_FOUND: {
            TITLE: "Page not found",
            DETAILS: "Looks like this page doesn't exist or you don't have permission to view it.",
            CODE: "ERROR 404",
        },
        VALIDATION: "Some fields are required or invalid.",
        FETCH_DROPDOWN: "Failed to load dropdown",
        RESOURCE_NOT_FOUND: "Resource not found.",
        INVALID_REFRESH_TOKEN: "Invalid refresh token.",
        LOGIN_FAILED: "Login failed.",
        USER_CONTEXT_FAILED: "Failed to fetch user context.",
    },

    /**
     * User Feedback & Notifications
     */
    MESSAGES: {
        INFO: {
            SAVE_NO_CHANGES: "No changes to save",
            NO_DOCUMENTS: "No documents available",
            SUCCESS_SAVE: "Information saved successfully",
        },
        WARNING: {
            NO_DOCUMENTS: "No document types are available.",
            ALL_DOCUMENTS_ADDED: "All available document types have already been added.",
        }
    },

    /**
     * Interaction Labels
     */
    ACTION_BUTTONS: {
        ADD: 'Add',
        EDIT: 'Edit',
        VIEW: 'View',
        DELETE: 'Delete',
        CANCEL: 'Cancel',
        CONFIRM: 'Confirm',
        CONTINUE: 'Continue',
        BACK: 'Back',
        PAY_FEES: 'Pay Fees',
        DOWNLOAD: 'Download',
        VIEW_RECEIPT: 'View Receipt',
        UNSUSPEND: 'Unsuspend',
        SUSPEND: 'Suspend',
        SAVE: 'Save',
        PUBLISH: 'Publish',
        OK: 'OK',
        CLOSE: 'Close',
        TODAY: 'Today',
        CLEAR_ALL: 'Clear All',
        MONTH: 'Month',
        WEEK: 'Week',
        DAY: 'Day',
        APPLY: 'Apply',
        RESET: 'Reset',
        FILTER: 'Filter',
        IMPORT: 'Import',
        REFRESH: 'Refresh',
        ACCEPT: 'Accept',
        REJECT: 'Reject',
        NEEDS_CORRECTION: 'Needs Correction',
        INACTIVATE_USER: 'Inactivate User',
        INACTIVATE_ROLE: 'Inactivate Role',
    },

    /**
     * Dynamic Functions
     */
    ACTIONS: {
        UPLOAD_PDF: 'Upload PDF',
        CHANGE_PDF: 'Change PDF',
        CONFIRM_DELETE(name: string) {
            return `Are you sure you want to delete "${name}"?`;
        },
        CONFIRM_PUBLISH(name: string) {
            return `Are you sure you want to publish the fee structure for "${name}"?`;
        },
        CONFIRM_USER_ACTION(action: 'delete' | 'inactivate', name: string, targetType: 'user' | 'account' | 'role', rolesStr: string) {
            const question = targetType === 'role'
                ? `Are you sure you want to ${action} "${name}"'s role?`
                : `Are you sure you want to ${action} "${name}"?`;

            let warning = '';
            if (targetType === 'user') {
                warning = `Every associated users (${rolesStr}) data will be deactivated.`;
            } else if (targetType === 'account') {
                warning = `Associated role (${rolesStr}) will be ${action === 'delete' ? 'deleted' : 'deactivated'}.`;
            } else if (targetType === 'role') {
                warning = `Associated user (${rolesStr}) will be deactivated.`;
            }

            return `${question} \n\nWarning: ${warning}`;
        },
    },

    /**
     * Data Fields / Form Labels
     */
    LABELS: {
        USER: {
            USER: 'User',
            USER_ID: 'User ID',
            USER_TYPE: 'User Type',
            ROLE: 'Role',
            TEACHER: 'Teacher',
            STUDENT: 'Student',
            GUARDIAN: 'Guardian',
            GUARDIAN_TYPE: 'Guardian Type',
            GUARDIAN_SUB_TYPE: 'Guardian Sub Type',
        },
        ROLE: {
            ROLE_ID: 'Role ID',
            ROLE_NAME: 'Role Name',
        },
        PERMISSION: {
            PERMISSION_ID: 'Permission ID',
            PERMISSION_NAME: 'Permission Name',
            MNEMONIC: 'Mnemonic',
            PAGE: 'Page',
            PARENT_PERMISSION: 'Parent Permission',
            IS_ACTION: 'Is Action?',
        },
        COMMON: {
            NAME: 'Name',
            FIRST_NAME: 'First Name',
            MIDDLE_NAME: 'Middle Name',
            LAST_NAME: 'Last Name',
            FULL_NAME: 'Full Name',
            EMAIL: 'Email',
            PHONE_NUMBER: 'Phone Number',
            START_DATE: 'Start Date',
            END_DATE: 'End Date',
            DUE_DATE: 'Due Date',
            START_TIME: 'Start Time',
            END_TIME: 'End Time',
            TIME: 'Time',
            DOB: 'Date Of Birth',
            GENDER: 'Gender',
            PASSWORD: 'Password',
            CATEGORY: 'Category',
            STATUS: 'Status',
            IS_ACTIVE: 'Is Active?',
            DATE_RANGE: 'Date Range',
            CLASSROOM: 'Classroom',
            AMOUNT: 'Amount',
            IS_PUBLISHED: 'Is Published',
            OCCUPATION: 'Occupation',
            ADDRESS: 'Address',
            REMARKS: 'Remarks',
            TOTAL: 'Total',
            FREQUENCY: 'Frequency',
            CODE: 'Code',
            DATE: 'Date',
            ACTION: 'Action',
            MARK_SELECTED: 'Mark Selected',
            COLOR_CODE: 'Color Code',
            EVENT_TYPE: 'Event Type Name',
        },
        ACADEMIC: {
            CLASS: 'Class',
            SUBJECT: 'Subject',
            TEACHER_ID: 'Teacher ID',
            TEACHER_CODE: 'Teacher Code',
            JOINING_DATE: 'Joining Date',
            EXPERIENCE: 'Experience Years',
            CONTRACT: 'Contract Type',
            SHIFT: 'Shift',
            YEAR: 'Academic Year',
            LOCATION: 'Work Location',
            ACADEMIC_YEAR: 'Current Academic Year',
            ADMISSION_NUMBER: 'Admission Number',
            ADMISSION_DATE: 'Admission Date',
            ROLL_NUMBER: 'Roll Number',
            SUSPENDED: 'Suspended',
            IS_SUSPENDED: 'Is Suspended?',
            STUDENT_ID: 'Student ID',
            STUDENT_DOCUMENT_ID: 'Student Document ID',
            TEACHER_DOCUMENT_ID: 'Teacher Document ID',
        },
        FEE: {
            FEE_TYPE: 'Fee Type',
            FEE_STRUCTURE: 'Fee Structure',
            STUDENT_FEE: 'Student Fee',
            FEES_BREAKDOWN: 'Fees Breakdown',
            PAID_AMOUNT: 'Paid Amount',
            REMAINING_AMOUNT: 'Remaining Amount',
            LATE_FEE: 'Late Fee',
            ADJUSTMENT: 'Adjustment',
            ADJUSTMENT_AMOUNT: 'Adjustment Amount',
            ADJUSTMENT_TYPE: 'Adjustment Type',
            DUE_AMOUNT: 'Due Amount',
            PAYABLE_AMOUNT: 'Payable Amount',
            FEE_STATUS: 'Fee Status',
            TOTAL_PAYABLE: 'Total Payable',
            TOTAL_PAID: 'Total Paid',
            TOTAL_OUTSTANDING: 'Total Outstanding',
            LATE_FEE_AMOUNT: 'Late Fee Amount',
            FEE_TYPE_NAME: 'Fee Type Name',
            TOTAL_AMOUNT: 'Total Amount',
            PAYMENT_MODE: 'Payment Mode',
            TRANSACTION_ID: 'Transaction ID'
        },
        ADDRESS: {
            CURRENT: 'Current Address',
            PERMANENT: 'Permanent Address',
        },
        BANK: {
            ACCOUNT_NUMBER: 'Bank Account Number',
            BANK_NAME: 'Bank Name',
            IFSC_CODE: 'IFSC Code',
            NATIONAL_ID: 'National Identification Number',
        },
        MEDICAL: {
            BLOOD_GROUP: 'Blood Group',
            HEIGHT: 'Height',
            WEIGHT: 'Weight',
        },
        SCHOOL: {
            PREVIOUS_NAME: 'Previous School Name',
            PREVIOUS_ADDRESS: 'Previous School Address',
        },
        DOCUMENTS: {
            PATH: 'Document Path',
            FILE: 'Document',
            TYPE: 'Document Type',
            IMAGE: 'Document Image',
            VIEW_IMAGE: 'View Document',
            TEACHER_PHOTO: 'Teacher Photo',
            STUDENT_PHOTO: 'Student Photo',
            USER_PROFILE_PHOTO: 'User Profile Photo',
        },
        QUALIFICATION: {
            QUALIFICATION: 'Qualification',
            PASSING_YEAR: 'Passing Year',
            INSTITUTION: 'Institution Name',
            UNIVERSITY: 'University Name',
            IS_PERCENTAGE: 'Is Percentage?',
            MARKS: 'CGPA / Percentage',
            CGPA: 'CGPA',
            PERCENTAGE: 'Percentage'
        },
        FILE_UPLOAD: {
            ADD_FILE: 'Add File',
            CHANGE_FILE: 'Change File',
            UPLOAD_FILE: 'Upload File',
        }
    },

    /**
     * Section Headers
     */
    SECTIONS: {
        BASIC_INFORMATION: 'Basic Information',
        PERSONAL: 'Personal Information',
        ACADEMIC: 'Academic Information',
        ADDRESS: 'Address Information',
        CLASS: 'Class Information',
        PROFILE: 'Profile Detail',
        DOCUMENTS: 'Documents',
        PREVIOUS_SCHOOL: 'Previous School Details',
        BANK: 'Bank Details',
        PROFESSIONAL: 'Professional Information',
        MEDICAL: 'Medical Details',
        OTHER: 'Other Details',
        ROLE_AND_STATUS: 'Role And Status',
        FEE_STRUCTURE: 'Fee Structure',
        GUARDIAN_INFO: 'Guardian Information',
        FEE_TYPE: 'Fee Type',
        QUALIFICATIONS: 'Qualifications'
    },

    /**
     * Weekdays Headers
     */
    WEEKDAYS: {
        MONDAY: 'Monday',
        TUESDAY: 'Tuesday',
        WEDNESDAY: 'Wednesday',
        THURSDAY: 'Thursday',
        FRIDAY: 'Friday',
        SATURDAY: 'Saturday',
        SUNDAY: 'Sunday',
    },

    HOLIDAY: {
        WARNING_WEEKEND: 'The selected date is a weekend.',
        DUPLICATE: 'This date is already configured as a holiday.',
        WARNING_HOLIDAY: 'The selected date is holiday/weekend.'
    },

    /**
     * Enums / Fixed States
     */
    STATUS: {
        ACTIVE: 'Active',
        INACTIVE: 'Inactive',
        PROGRESS: {
            PENDING: 'Pending',
            SUBMITTED: 'Submitted',
            REVIEWED: 'Reviewed',
            IN_PROGRESS: 'In Progress',
            COMPLETED: 'Completed',
            REJECTED: 'Rejected',
            NEEDS_CORRECTION: 'Needs Correction',
            UPCOMING: 'Upcoming'
        }
    },
    UNAUTHORIZE: {
        TITLE: "🚫 Unauthorized Access",
        DETAILS: "You don't have permission to view this page."
    },
    NOT_FOUND: {
        TITLE: "Page not found",
        DETAILS: "Looks like this page doesn't exist or you don't have permission to view it.",
        CODE: "ERROR 404"
    },
    ACTION: {
        EDIT: 'Edit',
        DELETE: 'Delete'
    },
    TOOLTIPS: {
        PREVIOUS: 'Previous',
        NEXT: 'Next',
        SELECT_DATE: 'Select Date',
    }
}

export const ICON_MAPPING: Record<string, string> = {
    // ================== ADMIN USER TYPE ==================
    'DASHBOARD': 'dashboard',
    'CONFIGURATION': 'list_alt',
    'USER': 'people',
    'TIMETABLE': 'schedule',
    'ATTENDANCE': 'event_note',
    'CALENDAR': 'calendar_month',
    'EXAMINATION': 'grading',
    'FEE': 'attach_money',
    'COMMUNICATION': 'chat',
    'REPORT': 'bar_chart',
    'SETTING': 'admin_panel_settings',
    'HOMEWORK': 'assignment',
    'NOTICES': 'campaign',
    'SITE_CONFIGURATION': 'display_settings',
    'SETTINGS': 'settings',

    // ================== TEACHER USER TYPE ==================
    'T_DASHBOARD': 'dashboard',
    'T_PROFILE': 'account_circle',
    'T_TIMETABLE': 'schedule',
    'T_ATTENDANCE': 'event_note',
    'T_STUDENT': 'school',
    'T_CLASS_STUDENTS': 'school',
    'T_EXAMINATION': 'assessment',
    'T_COMMUNICATION': 'chat',
    'T_REPORT': 'bar_chart',
    'T_HOMEWORK': 'assignment',
    'T_CALENDAR': 'calendar_month',
    'T_NOTICES': 'campaign',

    // ================== STUDENT USER TYPE ==================
    'S_DASHBOARD': 'dashboard',
    'S_PROFILE': 'account_circle',
    'S_TIMETABLE': 'schedule',
    'S_ATTENDANCE': 'event_note',
    'S_SUBJECTS': 'book',
    'S_CLASS': 'menu_book',
    'S_BIRTHDAYS': 'cake',
    'S_TEACHERS': 'person',
    'S_EXAMINATION': 'assessment',
    'S_FEE': 'attach_money',
    'S_COMMUNICATION': 'chat',
    'S_HOMEWORKS': 'assignment',
    'S_CALENDAR': 'calendar_month',
    'S_NOTICES': 'campaign',
    'S_CLASSMATES': 'group',

    // ================== PARENT USER TYPE ==================
    'P_DASHBOARD': 'dashboard',
    'P_CHILD': 'family_restroom',
    'P_FEE': 'attach_money',
    'P_COMMUNICATION': 'chat'
}

export const getFullMonth: DropdownOption[] = [
    { value: 1, text: 'January' },
    { value: 2, text: 'February' },
    { value: 3, text: 'March' },
    { value: 4, text: 'April' },
    { value: 5, text: 'May' },
    { value: 6, text: 'June' },
    { value: 7, text: 'July' },
    { value: 8, text: 'August' },
    { value: 9, text: 'September' },
    { value: 10, text: 'October' },
    { value: 11, text: 'November' },
    { value: 12, text: 'December' }
];

export const getAllowedYear = [
    { value: 2026, text: '2026' },
];

export const DASHBOARD_SHARED_CONSTANTS = {
    TITLES: {
        ATTENDANCE: "Today's Attendance",
        STUDENT_ATTENDANCE: 'Student Attendance',
        TEACHER_ATTENDANCE: 'Teacher Attendance',
        MY_ATTENDANCE: 'My Attendance',
        STUDENTS_TODAY_ATTENDANCE: "Students Today's Attendance",
        EVENTS: 'Upcoming Events',
        EXAMS: 'Upcoming Exams',
        NOTICES: 'Notices',
        TIMETABLE: "Today's Timetable",
        HOMEWORKS: 'Homeworks',
        MY_RECENT_EXAMS: 'My Recent Exams',
        MY_RECENT_HOMEWORKS: 'My Recent Homeworks',
        BIRTHDAYS: "Today's Birthdays",
        HOLIDAYS: 'Holidays',
    },
    LABELS: {
        TOTAL: 'Total',
        VIEW_ALL: 'View All',
        HIDE_SECTION: 'Hide Section',
        ALL_DAY: 'All Day',
        PRESENT: 'Present',
        ABSENT: 'Absent',
        HALF_DAY: 'Half Day',
        LATE: 'Late',
        ROOM: 'Room',
        TOTAL_STUDENTS: 'Total Students',
        TOTAL_TEACHERS: 'Total Teachers',
        TOTAL_SUBMITTED: 'Total Submitted',
        TOTAL_REVIEWED: 'Total Reviewed',
        DUE: 'Due',
        PASS: 'Pass',
        MAX: 'Max',
        PENDING: 'Pending',
        HOMEWORK: 'Homework',
        COMPLETED: 'Completed',
        BREAK: 'Break',
        TEACHER: 'Teacher',
    },
    TABLE_HEADERS: {
        EXAM: 'Exam',
        CLASS: 'Class',
        CLASSROOMS: 'Classrooms',
        SUBJECT: 'Subject',
        ROOM: 'Room',
        TIME: 'Time',
        MARKS_ENTRY: 'Marks Entry',
        HOMEWORK: 'Homework',
        REVIEWED: 'Reviewed',
        TEACHER: 'Teacher',
        DATE: 'Date',
        MARKS: 'Marks',
        GRADE: 'Grade',
        RESULT: 'Result',
        STATUS: 'Status',
        TITLE: 'Title',
        DUE_DATE: 'Due Date',
        SUBMITTED: 'Submitted',
    },
    ACTIONS: {
        WISH_BIRTHDAY(name: string) {
            return `Wish ${name} a happy birthday!`;
        }
    },
    EMPTY_STATES: {
        EVENTS: 'No upcoming events',
        EXAMS: 'No upcoming exams',
        NOTICES: 'No recent notices',
        TIMETABLE: 'No classes scheduled for today',
        HOMEWORKS: 'No recent homeworks found',
        MY_RECENT_EXAMS: 'No recent exams found',
        MY_RECENT_HOMEWORKS: 'No recent homeworks found',
        BIRTHDAYS: 'No birthdays today',
        HOLIDAYS: 'No upcoming holidays',
    },
    KPI: {
        TOTAL_STUDENTS: 'Total Students',
        TOTAL_TEACHERS: 'Total Teachers',
        TOTAL_SECTIONS: 'Total Sections',
        TOTAL_FEES_COLLECTED: 'Total Fees Collected',
        TOTAL_PENDING_FEES: 'Total Pending Fees',
    },
    NOTICE: {
        NOTICE_DETAILS: "Notice Details",
        IMPORTANT: "Important",
        TITLE: "Title",
        PUBLISH_DATE: "Publish Date",
        EXPIRY_DATE: "Expiry Date",
        DESCRIPTION: "Description",
        ATTACHMENT: "Attachment"
    },
    CONFIRM_HIDE: {
        TITLE: 'Hide Widget',
        MESSAGE: 'Are you sure you want to hide this widget?',
        CONFIRM_TEXT: 'Hide',
        CANCEL_TEXT: 'Cancel'
    }
};



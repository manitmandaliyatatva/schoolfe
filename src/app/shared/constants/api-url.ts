import { environment } from "../../../environments/environment";

export const BASE_API_URL = environment.apiEndpoint;

export const API_ROOT = {
    AUTH: 'Auth',
    NOTIFICATION: 'Notification',
    SECTION: 'section',
    SUBJECT: 'subject',
    CLASS: 'Class',
    CLASS_SECTION: 'ClassSection',
    CLASS_SUBJECT: 'ClassSubject',
    ACADEMIC_YEAR: 'AcademicYear',
    DOCUMENT_TYPE: 'DocumentType',
    STUDENT_CATEGORY: 'StudentCategory',
    ROLE: 'Role',
    STUDENT: 'Student',
    GUARDIAN: 'Guardian',
    USER: 'User',
    TEACHER: 'Teacher',
    EXAM_TYPE: 'ExamType',
    EXAM: 'Exam',
    EXAM_GROUP: 'ExamGroup',
    EXAM_STUDENT: 'ExamStudent',
    TIMESLOTS: 'TimeSlots',
    TIMETABLE: 'TimeTable',
    HOMEWORK: 'Homework',
    HOMEWORK_STUDENT: 'HomeworkStudent',
    ATTENDENCE_STATUS: 'AttendanceStatus',
    STUDENT_ATTENDANCE: 'StudentAttendance',
    TEACHER_ATTENDANCE: 'TeacherAttendance',
    EVENT_TYPE: 'EventType',
    EVENT: 'Event',
    DASHBOARD_CONFIG: 'DashboardConfiguration',
    TEACHER_DASHBOARD: 'TeacherDashboard',
    ADMIN_DASHBOARD: 'AdminDashboard',
    STUDENT_DASHBOARD: 'StudentDashboard',
    HOLIDAY: 'Holidays',
    SPECIAL_DAY_OVERRIDE: 'SpecialDayOverride',
    WEEKLY_OFF_CONFIG: 'WeeklyOffConfig',
    LOOKUP_VALUE: 'LoockupValue',
    ROLE_PERMISSIONS: 'RolePermissions',
    PERMISSION: 'Permission',
}

export const API = {
    LOOKUP_VALUE: {
        GET_LOOKUP_VALUE_LIST: 'LoockupValue/GetLookupValueList',
    },
    AUTH: {
        LOGIN: API_ROOT.AUTH + "/login",
        REFRESH_TOKEN: API_ROOT.AUTH + "/refresh-token",
        LOGOUT: API_ROOT.AUTH + "/logout",
        ROLES_PERMISSION: API_ROOT.AUTH + '/GetPageAndRolePermission',
        FORGOT_PASSWORD: API_ROOT.AUTH + '/ForgotPassword',
        RESET_PASSWORD: API_ROOT.AUTH + '/ResetPassword',
        CHANGE_PASSWORD: API_ROOT.AUTH + '/ChangePassword',
        GET_USER_CONTEXT: API_ROOT.AUTH + '/GetUserContext'
    },
    // TODO: Update endpoints
    NOTIFICATION: {
        GET_ALL: API_ROOT.NOTIFICATION + '/GetNotificationList',
        GET_BY_ID: API_ROOT.NOTIFICATION + '/GetById',
        MARK_AS_READ: API_ROOT.NOTIFICATION + '/MarkAsRead',
        MARK_ALL_AS_READ: API_ROOT.NOTIFICATION + '/MarkAllAsRead',
        HUB_URL:  '/notificationHub',
        GET_SETTINGS: API_ROOT.NOTIFICATION + '/GetNotificationSettings',
        UPDATE_SETTINGS: API_ROOT.NOTIFICATION + '/UpdateNotificationSettings'
    },
    CLASS: {
        GET_SECTION_LIST: API_ROOT.SECTION + '/GetSectionList',
        GET_SECTION_BY_ID: API_ROOT.SECTION + '/GetSectionById',
        ADD_UPDATE_SECTION: API_ROOT.SECTION + '/AddUpdateSection',
        DELETE_SECTION: API_ROOT.SECTION + '/DeleteSection',
        GET_SUBJECT_LIST: API_ROOT.SUBJECT + '/GetSubjectList',
        GET_SUBJECT_BY_ID: API_ROOT.SUBJECT + '/GetSubjectById',
        ADD_UPDATE_SUBJECT: API_ROOT.SUBJECT + '/AddUpdateSubject',
        DELETE_SUBJECT: API_ROOT.SUBJECT + '/DeleteSubject',
        SUBJECT_DROPDOWN: API_ROOT.SUBJECT + '/GetSubjectListDropdown',
        GET_CLASS_LIST: API_ROOT.CLASS + '/GetClassList',
        GET_CLASS_DROPDOWN: API_ROOT.CLASS + '/GetClassListDropdown',
        GET_CLASS_BY_ID: API_ROOT.CLASS + '/GetClassById',
        ADD_UPDATE_CLASS: API_ROOT.CLASS + '/AddUpdateClass',
        DELETE_CLASS: API_ROOT.CLASS + '/DeleteClass',
        GET_CLASS_SUBJECT_LIST: API_ROOT.CLASS_SUBJECT + '/GetClassSubjectList',
        GET_CLASS_SUBJECT_BY_ID: API_ROOT.CLASS_SUBJECT + '/GetClassSubjectById',
        ADD_UPDATE_CLASS_SUBJECT: API_ROOT.CLASS_SUBJECT + '/AddUpdateClassSubject',
        DELETE_CLASS_SUBJECT: API_ROOT.CLASS_SUBJECT + '/DeleteClassSubject',
        CLASS_SUBJECT_DROPDOWN: API_ROOT.CLASS_SUBJECT + '/GetClassSubjectListDropdown',
        GET_CLASS_SECTION_LIST_BY_CLASS: API_ROOT.CLASS_SECTION + '/GetClassSectionListByClassDropdown'
    },
    WIDGET_CONFIG: {
        GET: API_ROOT.DASHBOARD_CONFIG + '/GetWidgetConfiguration',
        SAVE: API_ROOT.DASHBOARD_CONFIG + '/AddUpdateWidgetConfiguration',
        GLOBAL_FILTERS: API_ROOT.DASHBOARD_CONFIG + '/AddUpdateGlobalFilters'
    },
    IMPORT_FILE: {
        TEACHER: API_ROOT.TEACHER + "/ImportTeacherExcel",
        STUDENT: API_ROOT.STUDENT + "/ImportStudentExcelFile",
        EXAM_STUDENT: API_ROOT.EXAM_STUDENT + "/ImportStudentExamMarkExcelFile",
        STUDENT_ATTENDANCE: API_ROOT.STUDENT_ATTENDANCE + "/ImportStudentAttendanceExcel",
        TEACHER_ATTENDANCE: API_ROOT.TEACHER_ATTENDANCE + "/ImportTeacherAttendanceExcel"
    },
    SAMPLE_FILE: {
        TEACHER: API_ROOT.TEACHER + "/DownloadSampleTeacherExcel",
        STUDENT: API_ROOT.STUDENT + "/DownloadSampleStudentExcel",
        EXAM_STUDENT: API_ROOT.EXAM_STUDENT + "/DownloadSampleStudentMarksExcel",
        STUDENT_ATTENDANCE: API_ROOT.STUDENT_ATTENDANCE + "/DownloadSampleStudentAttendanceExcel",
        TEACHER_ATTENDANCE: API_ROOT.TEACHER_ATTENDANCE + "/DownloadSampleTeacherAttendanceExcel"
    },
    ADMIN: {
        DASHBOARD: {
            GET_SUMMARY: API_ROOT.ADMIN_DASHBOARD + "/GetAdminDashboardSummary"
        },
        CALENDAR: {
            EVENT_TYPES: {
                LIST: API_ROOT.EVENT_TYPE + '/GetEventTypeList',
                GET: API_ROOT.EVENT_TYPE + '/GetEventTypeById',
                ADDUPDATE: API_ROOT.EVENT_TYPE + '/AddUpdateEventType',
                DELETE: API_ROOT.EVENT_TYPE + '/DeleteEventType',
                DROPDOWN: API_ROOT.EVENT_TYPE + '/GetEventTypeListDropdown'
            },
            EVENTS: {
                LIST: API_ROOT.EVENT + '/GetEventList',
                GET: API_ROOT.EVENT + '/GetEventById',
                ADDUPDATE: API_ROOT.EVENT + '/AddUpdateEvent',
                DELETE: API_ROOT.EVENT + '/DeleteEvent',
                BASE64: API_ROOT.EVENT + '/GetEventDocumentBase64String'
            }
        },
        CONFIGURATION: {
            DOCUMENT_TYPE: {
                LIST: API_ROOT.DOCUMENT_TYPE + '/GetDocumentTypeList',
                GET: API_ROOT.DOCUMENT_TYPE + '/GetDocumentTypeById',
                ADDUPDATE: API_ROOT.DOCUMENT_TYPE + '/AddUpdateDocumentType',
                DELETE: API_ROOT.DOCUMENT_TYPE + '/DeleteDocumentType',
                DROPDOWN: API_ROOT.DOCUMENT_TYPE + '/GetDocumentTypeListDropdown'
            },
            STUDENT_CATEGORY: {
                LIST: API_ROOT.STUDENT_CATEGORY + '/GetStudentCategoryList',
                GET: API_ROOT.STUDENT_CATEGORY + '/GetStudentCategoryById',
                ADDUPDATE: API_ROOT.STUDENT_CATEGORY + '/AddUpdateStudentCategory',
                DELETE: API_ROOT.STUDENT_CATEGORY + '/DeleteStudentCategory',
                DROPDOWN: API_ROOT.STUDENT_CATEGORY + '/GetStudentCategoryListDropdown'
            },
            ACADEMIC_YEAR: {
                LIST: API_ROOT.ACADEMIC_YEAR + '/GetAcademicYearList',
                GET: API_ROOT.ACADEMIC_YEAR + '/GetAcademicYearById',
                ADDUPDATE: API_ROOT.ACADEMIC_YEAR + '/AddUpdateAcademicYear',
                DELETE: API_ROOT.ACADEMIC_YEAR + '/DeleteAcademicYear',
                DROPDOWN: API_ROOT.ACADEMIC_YEAR + '/GetAcademicYearListDropdown',
                SET_CURRENT: API_ROOT.ACADEMIC_YEAR + '/SetCurrentAcademicYear'
            },
            CLASSROOM: {
                LIST: API_ROOT.CLASS_SECTION + '/GetClassSectionList',
                GET: API_ROOT.CLASS_SECTION + '/GetClassSectionById',
                ADDUPDATE: API_ROOT.CLASS_SECTION + '/AddUpdateClassSection',
                DELETE: API_ROOT.CLASS_SECTION + '/DeleteClassSection',
                DROPDOWN: API_ROOT.CLASS_SECTION + '/GetClassSectionListDropdown'
            },
            CLASS_SUBJECT: {
                LIST: API_ROOT.CLASS_SUBJECT + '/GetClassSubjectList',
                GET: API_ROOT.CLASS_SUBJECT + '/GetClassSubjectById',
                ADDUPDATE: API_ROOT.CLASS_SUBJECT + '/AddUpdateClassSubject',
                DELETE: API_ROOT.CLASS_SUBJECT + '/DeleteClassSubject',
            },
            TIMESLOT: {
                LIST: API_ROOT.TIMESLOTS + '/GetTimeSlotsList',
                GET: API_ROOT.TIMESLOTS + '/GetTimeSlotById',
                ADDUPDATE: API_ROOT.TIMESLOTS + '/AddUpdateTimeSlot',
                DELETE: API_ROOT.TIMESLOTS + '/DeleteTimeSlot'
            },
            TIMETABLE: {
                LIST: API_ROOT.TIMETABLE + '/GetTimeTableList',
                GET: API_ROOT.TIMETABLE + '/GetTimeTableById',
                ADDUPDATE: API_ROOT.TIMETABLE + '/AddUpdateTimeTable',
                DELETE: API_ROOT.TIMETABLE + '/DeleteTimeTable',
                DOWNLOAD: API_ROOT.TIMETABLE + '/DownloadTimeTable'
            },
            ATTENDENCE_STATUS: {
                LIST: API_ROOT.ATTENDENCE_STATUS + '/GetAttendanceStatusList',
                GET: API_ROOT.ATTENDENCE_STATUS + '/GetAttendanceStatusById',
                ADDUPDATE: API_ROOT.ATTENDENCE_STATUS + '/AddUpdateAttendanceStatus',
                DELETE: API_ROOT.ATTENDENCE_STATUS + '/DeleteAttendanceStatus',
                DROPDOWN: API_ROOT.ATTENDENCE_STATUS + '/GetAttendanceStatusListDropdown'
            },
            GENERAL_SETTINGS: {
                WEEKLY_OFF_CONFIG: {
                    GET: API_ROOT.WEEKLY_OFF_CONFIG + '/GetWeeklyOffConfig',
                    SAVE: API_ROOT.WEEKLY_OFF_CONFIG + '/AddUpdateWeeklyOffConfig'
                },
            },
            HOLIDAY: {
                LIST: API_ROOT.HOLIDAY + '/GetHolidaysList',
                GET: API_ROOT.HOLIDAY + '/GetHolidayById',
                ADDUPDATE: API_ROOT.HOLIDAY + '/AddUpdateHoliday',
                DELETE: API_ROOT.HOLIDAY + '/DeleteHoliday',
                GET_ALL: API_ROOT.HOLIDAY + '/GetAllHolidaysList'
            },
            SPECIAL_DAY_OVERRIDE: {
                LIST: API_ROOT.SPECIAL_DAY_OVERRIDE + '/GetSpecialDayOverrideList',
                GET: API_ROOT.SPECIAL_DAY_OVERRIDE + '/GetSpecialDayOverrideById',
                ADDUPDATE: API_ROOT.SPECIAL_DAY_OVERRIDE + '/AddUpdateSpecialDayOverride',
                DELETE: API_ROOT.SPECIAL_DAY_OVERRIDE + '/DeleteSpecialDayOverride',
            }
        },
        FEE: {
            FEE_TYPE: {
                LIST: "FeesType/GetFeeTypeList",
                GET: "FeesType/GetFeeTypeById",
                ADDUPDATE: "FeesType/AddUpdateFeeType",
                DELETE: "FeesType/DeleteFeeType",
                DROPDOWN: "FeesType/GetFeeTypeListDropdown"
            },
            FEE_STRUCTUER: {
                LIST: "FeeStructure/GetFeeStructureList",
                GET: "FeeStructure/GetFeeStructureById",
                ADDUPDATE: "FeeStructure/AddUpdateFeeStructure",
                DELETE: "FeeStructure/DeleteFeeStructure",
                GENERATE: "FeeStructure/GenerateFeeStudent",
            },
            STUDENT_FEE: {
                LIST: "FeeStudent/GetFeeStudentList",
                GET: "FeeStudent/GetFeeStudentsByStudentId",
                ADDUPDATE: "FeeStudent/AddUpdateFeeStudent",
                DELETE: "FeeStudent/DeleteFeeStudent",
                GET_BY_STUDENT_ID: "FeeStudent/GetFeeStudentsByStudentId",
                UNPAID_DROPDOWN: "FeeStudent/GetUnpaidFeeStudentDropdown"
            },
            FEE_PAYMENT: {
                ADDUPDATE: "FeePayment/AddFeePayment",
                CREATE_PAYMENT_INTENT: "FeePayment/CreatePaymentIntent",
                GET_STUDENTS_WITH_FEE_PAYMENTS: "FeePayment/GetPaymentStudentList",
                GET_FEE_PAYMENT_HISTORY_LIST: "FeePayment/GetFeePaymentHistoryList",
                GET_RECEIPT: "FeePayment/GetFeePaymentReceipt"
            },
            LATE_FEE: {
                LIST: "LateFeeConfig/GetLateFeeConfigList",
                GET: "LateFeeConfig/GetLateFeeConfigById",
                ADDUPDATE: "LateFeeConfig/AddUpdateLateFeeConfig",
                DELETE: "LateFeeConfig/DeleteLateFeeConfig"
            },
            FEE_ADJUSTMENT: {
                LIST: "FeeAdjustment/GetFeeAdjustmentList",
                GET: "FeeAdjustment/GetFeeAdjustmentById",
                ADDUPDATE: "FeeAdjustment/AddUpdateFeeAdjustment",
                DELETE: "FeeAdjustment/DeleteFeeAdjustment"
            }
        },
        EXAMINATION: {
            EXAM: {
                LIST: API_ROOT.EXAM + '/GetExamList',
                GET: API_ROOT.EXAM + '/GetExamById',
                ADDUPDATE: API_ROOT.EXAM + '/AddUpdateExam',
                DELETE: API_ROOT.EXAM + '/DeleteExam'
            },
            EXAM_TYPE: {
                LIST: API_ROOT.EXAM_TYPE + '/GetExamTypeList',
                GET: API_ROOT.EXAM_TYPE + '/GetExamTypeById',
                ADDUPDATE: API_ROOT.EXAM_TYPE + '/AddUpdateExamType',
                DELETE: API_ROOT.EXAM_TYPE + '/DeleteExamType',
                DROPDOWN: API_ROOT.EXAM_TYPE + '/GetExamTypeListDropdown',
            },
            EXAM_GROUP: {
                LIST: API_ROOT.EXAM_GROUP + '/GetExamGroupList',
                GET: API_ROOT.EXAM_GROUP + '/GetExamGroupById',
                ADDUPDATE: API_ROOT.EXAM_GROUP + '/AddUpdateExamGroup',
                DELETE: API_ROOT.EXAM_GROUP + '/DeleteExamGroup'
            },
            MARKS: {
                SAVE_BULK: API_ROOT.EXAM_STUDENT + '/SaveMarksBulk',
                SAVE_SINGLE: API_ROOT.EXAM_STUDENT + '/AddUpdateExamStudent',
                EXPORT: API_ROOT.EXAM_STUDENT + '/ExportStudentExamMarks',
                GET_COMPLETED_EXAM_GROUP_LIST: API_ROOT.EXAM_STUDENT + '/GetCompletedExamGroupList',
                GET_EXAM_GROUP_MARK_DETAILS: API_ROOT.EXAM_STUDENT + '/GetExamGroupMarkDetails',
                GET_EXAM_GROUP_SUBJECT_LIST_DROPDOWN: API_ROOT.EXAM_STUDENT + '/GetExamGroupSubjectListDropdown',
                PUBLISH_EXAM_MARKS: API_ROOT.EXAM_STUDENT + '/PublishExamMarks',
            }
        },
        HOMEWORK: {
            LIST: API_ROOT.HOMEWORK + '/GetHomeworkList',
            GET_BY_ID: API_ROOT.HOMEWORK + '/GetHomeworkById',
            ADD_UPDATE: API_ROOT.HOMEWORK + '/AddUpdateHomework',
            DELETE: API_ROOT.HOMEWORK + '/DeleteHomework',
            GET_ATTACHMENT_BASE64: API_ROOT.HOMEWORK + '/GetHomeworkAttachmentBase64String',
            REVIEW_STUDENT_HOMEWORK: API_ROOT.HOMEWORK + '/ReviewStudentHomework',
            REVIEW_LIST: API_ROOT.HOMEWORK_STUDENT + '/GetReviewHomeworkList',
            REVIEW_DETAILS: API_ROOT.HOMEWORK_STUDENT + '/GetClassroomHomeworkDetails',
            REVIEW_SAVE_BULK: API_ROOT.HOMEWORK_STUDENT + '/SaveHomeworksBulk',
            STUDENT_SUBMISSION_BY_ID: API_ROOT.HOMEWORK_STUDENT + '/GetHomeworkStudentById',
            STUDENT_SUBMISSION_ATTACHMENT_BASE64: API_ROOT.HOMEWORK_STUDENT + '/GetHomeworkAttachmentBase64String',
            CHANGE_HOMEWORK_STATUS: API_ROOT.HOMEWORK_STUDENT + '/ChangeHomeworkStatus',
        },
        USER: {
            ROLE: {
                LIST: API_ROOT.ROLE + '/GetRoleList',
                GET: API_ROOT.ROLE + '/GetRoleById',
                ADDUPDATE: API_ROOT.ROLE + '/AddUpdateRole',
                DELETE: API_ROOT.ROLE + '/DeleteRole',
                USERTYPE: API_ROOT.ROLE + '/GetUserTypeListDropdown',
                ROLEBYUSERTYPE: API_ROOT.ROLE + '/GetRolesListByUserTypeIdDropdown'
            },
            ROLE_PERMISSIONS: {
                GET_DEFAULT: API_ROOT.ROLE_PERMISSIONS + '/GetDefaultRoleBasedPermissionsByUserTypeId',
                GET_ROLE_BASED: API_ROOT.ROLE_PERMISSIONS + '/GetRoleBasedPermissionsByRoleId',
                ADD_UPDATE: API_ROOT.ROLE_PERMISSIONS + '/AddUpdateRoleBasedPermission',
            },
            PERMISSION: {
                LIST: API_ROOT.PERMISSION + '/GetPermissionList',
                GET: API_ROOT.PERMISSION + '/GetPermissionById',
                ADDUPDATE: API_ROOT.PERMISSION + '/AddUpdatePermission',
                DELETE: API_ROOT.PERMISSION + '/DeletePermission',
                PARENT_DROPDOWN: API_ROOT.PERMISSION + '/GetParentPermissionListDropdown',
            },
            PAGES: {
                LIST: 'Pages/GetPagesList',
                GET: 'Pages/GetPageByPageId',
                ADDUPDATE: 'Pages/AddUpdatePages',
                DELETE: 'Pages/DeletePage',
                PARENT_DROPDOWN: 'Pages/GetParentPagesDropdown',
                ACTION_MNEMONIC_DROPDOWN: 'Pages/GetActionMnemonicDropdown',
            },
            STUDENT: {
                List: API_ROOT.STUDENT + '/GetStudentList',
                Get: API_ROOT.STUDENT + '/GetStudentById',
                ADDUPDATE: API_ROOT.STUDENT + '/AddUpdateStudent',
                DELETE: API_ROOT.STUDENT + '/DeleteStudent',
                OTHERDETAILS: API_ROOT.STUDENT + '/GetStudentOtherDetails',
                ADDUPDATEOTHERDETAILS: API_ROOT.STUDENT + '/AddUpdateStudentOtherDetails',
                ADDUPDATESTUDENTDOCUMENT: API_ROOT.STUDENT + '/AddUpdateStudentDocument',
                GETSTUDENTDOCUMENT: API_ROOT.STUDENT + '/GetStudentDocumentsById',
                GETSTUDENTDOCUMENTBASE64: API_ROOT.STUDENT + '/GetStudentDocumentBase64String',
                GETSTUDENTLISTDROPDOWN: API_ROOT.STUDENT + '/GetStudentListDropdown',
            },
            GUARDIAN: {
                LIST: API_ROOT.GUARDIAN + '/GetGuardianList',
                GET: API_ROOT.GUARDIAN + '/GetGuardianByStudentId',
                GETBYID: API_ROOT.GUARDIAN + '/GetGuardianById',
                EXISTINGGUARDIANDROPDOWN: API_ROOT.GUARDIAN + '/GetGuardiansListDropdown',
                ADDUPDATE: API_ROOT.GUARDIAN + '/AddUpdateGuardians',
                DELETE: API_ROOT.GUARDIAN + '/DeleteGuardianByStudentId',
            },
            USERS: {
                LIST: API_ROOT.USER + '/GetUserList',
                GET: API_ROOT.USER + '/GetUserById',
                ADDUPDATE: API_ROOT.USER + '/AddUpdateUser',
                DELETE: API_ROOT.USER + '/DeleteUser'
            },
            TEACHER: {
                LIST: API_ROOT.TEACHER + '/GetTeacherList',
                GET: API_ROOT.TEACHER + '/GetTeacherById',
                ADDUPDATE: API_ROOT.TEACHER + '/AddUpdateTeacher',
                DELETE: API_ROOT.TEACHER + '/DeleteTeacher',
                OtherDetails: API_ROOT.TEACHER + '/GetTeacherOtherDetails',
                ADDUPDATEOTHERDETAILS: API_ROOT.TEACHER + '/AddUpdateTeacherOtherDetails',
                GET_QUALIFICATIONS: API_ROOT.TEACHER + '/GetTeacherQualificationsList',
                ADD_UPDATE_QUALIFICATIONS: API_ROOT.TEACHER + '/AddUpdateTeacherQualification',
                ADDUPDATETEACHERDOCUMENT: API_ROOT.TEACHER + '/AddUpdateTeacherDocument',
                GETTEACHERDOCUMENT: API_ROOT.TEACHER + '/GetTeacherDocumentsById',
                GETTEACHERDOCUMENTBASE64: API_ROOT.TEACHER + '/GetTeacherDocumentBase64String',
                DROPDOWN: API_ROOT.TEACHER + '/GetTeacherListDropdown',
            },
        },
        COMMUNICATION: {
            NOTICE_TYPE: {
                LIST: "NoticeType/GetNoticeTypeList",
                ADDUPDATE: "NoticeType/AddUpdateNoticeType",
                GET: "NoticeType/GetNoticeTypeById",
                DELETE: "NoticeType/DeleteNoticeType",
                DROPDOWN: "NoticeType/GetNoticeTypeListDropdown"
            },

            NOTICE_AUDIANCE_TYPE: "NoticeAudienceType/GetNoticeAudienceTypeList",
            NOTICE_AUDIANCE_TYPE_DROPDOWN: "NoticeAudienceType/GetNoticeAudienceTypeListDropdown",
            ADD_NOTICE_AUDIANCE_TYPE: "NoticeAudienceType/AddUpdateNoticeAudienceType",
            NOTICE_AUDIANCE_TYPE_BYID: "NoticeAudienceType/GetNoticeAudienceTypeById",
            DELETE_NOTICE_AUDIANCE_TYPE: "NoticeAudienceType/DeleteNoticeAudienceType",

            NOTICE: {
                LIST: "Notice/GetNoticeList",
                ADDUPDATE: "Notice/AddUpdateNotice",
                GET: "Notice/GetNoticeById",
                DELETE: "Notice/DeleteNotice",
                DOCUMENT_DOWNLOAD: "Notice/GetNoticeDocumentBase64String",
                RELATED_NOTICE: 'Notice/GetRelatedNoticeList'
            },

            NOTICE_AUDIANCE_GROUP: {
                LIST: "NoticeGroup/GetNoticeGroupList",
                ADDUPDATE: "NoticeGroup/AddUpdateNoticeGroup",
                GET: "NoticeGroup/GetNoticeGroupById",
                DELETE: "NoticeGroup/DeleteNoticeGroup",
                DROPDOWN: "NoticeGroup/GetNoticeGroupAudienceByTypeId",
                LIST_DROPDOWN: "NoticeGroup/GetNoticeGroupListDropdown"
            }
        },
        SITE_CONFIGURATION: {
            CAROUSEL: {
                ADDUPDATE: 'Carousel/AddUpdateCarousel',
                LIST: 'Carousel/GetCarouselList',
                GETBYID: 'Carousel/GetDocumentTypeById',
                DELETE: 'Carousel/DeleteCarousel'
            },
            TESTIMONIAL: {
                ADDUPDATE: 'Testimonial/AddUpdateTestimonial',
                LIST: 'Testimonial/GetTestimonialList',
                GETBYID: 'Testimonial/GetTestimonialById',
                DELETE: 'Testimonial/DeleteTestimonial'
            },
            NEWS_ANNOUNCEMENT: {
                ADDUPDATE: 'NewsAnnouncement/AddUpdateNewsAnnouncement',
                LIST: 'NewsAnnouncement/GetNewsAnnouncementList',
                GETBYID: 'NewsAnnouncement/GetNewsAnnouncementById',
                DELETE: 'NewsAnnouncement/DeleteNewsAnnouncement'
            },
            FACILITY: {
                ADDUPDATE: 'Facility/AddUpdateFacility',
                LIST: 'Facility/GetFacilityList',
                GETBYID: 'Facility/GetFacilityById',
                DELETE: 'Facility/DeleteFacility'
            },
            CONTACTUS: {
                ADDUPDATE: 'SiteConfiguration/AddContactInquiry',
                LIST: 'ContactUsInquiry/GetContactUsInquiryList',
                GETBYID: 'ContactUsInquiry/GetContactById',
                DELETE: 'ContactUsInquiry/DeleteContactUsInquiry'
            },
            META_INFORMATION_LIST: 'SiteConfiguration/GetMetaInformation',
            META_INFORMATION: {
                ADDUPDATE: 'MetaInformation/AddUpdateMetaInformation',
                LIST: 'MetaInformation/GetMetaInformationList',
                GETBYID: 'MetaInformation/GetMetaInformationById'
            },
            ADD_CONTACT_US: 'SiteConfiguration/AddContactInquiry',
            CAROUSEL_LIST: 'SiteConfiguration/GetCarouselList',
            TESTIMONIAL_LIST: 'SiteConfiguration/GetTestimonialList',
            NEWS_LIST: 'SiteConfiguration/GetNewsAnnouncementList',
            NEWS_BYID: 'SiteConfiguration/GetNewsAnnouncementById',
            FACILITY_LIST: 'SiteConfiguration/GetFacilityList',
            GET_PUBLIC_SETTINGS: 'SiteConfiguration/GetSettingList',
            BRANCH_LIST: 'SiteConfiguration/GetBranchList'
        },
        SETTINGS: {
            SETTING_DEFINATION: {
                LIST: "SettingDefinition/GetSettingDefinitionList",
                ADDUPDATE: "SettingDefinition/AddUpdateSettingDefinition",
                GET: "SettingDefinition/GetSettingDefinitionById",
                DELETE: "SettingDefinition/DeleteSettingDefinition",
                UPDATE_VALUES: "SettingDefinition/UpdateSettingValues",
                GET_LAST_DISPLAY_ORDER: "SettingDefinition/GetLastDisplayOrder",
            },
            SETTING_GROUP: {
                LIST: "SettingGroup/GetSettingGroupList",
                ADDUPDATE: "SettingGroup/AddUpdateSettingGroup",
                GET: "SettingGroup/GetSettingGroupList",
                DELETE: "SettingGroup/DeleteSettingGroup",
                GETBYID: "SettingGroup/GetSettingGroupById",
                DROPDOWN: "SettingGroup/GetSettingGroupDropdown",
            }
        }

    },
    STUDENT: {
        DASHBOARD: {
            GET_SUMMARY: API_ROOT.STUDENT_DASHBOARD + "/GetStudentDashboardSummary"
        },
        EXAMINATION: {
            MY_RESULT: API_ROOT.EXAM_STUDENT + '/GetStudentExamResults',
            GET_CERTIFICATE: API_ROOT.EXAM_STUDENT + '/GetExamCertificateBase64',
            GET_TIMETABLE: API_ROOT.EXAM_GROUP + '/GetExamTimetablePdf',
        },
        HOMEWORK: {
            ADD_UPDATE: API_ROOT.HOMEWORK_STUDENT + '/AddUpdateHomeworkStudent',
            GET_BY_HW_ID: API_ROOT.HOMEWORK_STUDENT + '/GetHomeworkStudentById',
            GET_ATTACHMENT_BASE64: API_ROOT.HOMEWORK_STUDENT + '/GetHomeworkAttachmentBase64String',
        },
        ATTENDANCE: {
            ADDUPDATE: API_ROOT.STUDENT_ATTENDANCE + "/AppUpdateStudentAttendance",
            GET: API_ROOT.STUDENT_ATTENDANCE + "/GetStudentAttendanceList",
            DELETE: API_ROOT.STUDENT_ATTENDANCE + "/DeleteStudentAttendance",
            GET_BY_CLASS_SECTION: API_ROOT.STUDENT_ATTENDANCE + "/GetStudentListbyClassSectionId",
            MONTHLY_REPORT: API_ROOT.STUDENT_ATTENDANCE + "/MonthlyStudentAttendanceReport",
            DETAILS: API_ROOT.STUDENT_ATTENDANCE + "/GetAttendanceDetails",
            EXPORT: API_ROOT.STUDENT_ATTENDANCE + "/ExportStudentAttendance"
        }
    },
    TEACHER: {
        DASHBOARD: {
            GET_SUMMARY: API_ROOT.TEACHER_DASHBOARD + "/GetTeacherDashboardSummary",
            STUDENT_ATTENDANCE: API_ROOT.TEACHER_DASHBOARD + "/GetTeacherDashboardStudentsAttendance"
        },
        ATTENDANCE: {
            ADDUPDATE: `${API_ROOT.TEACHER_ATTENDANCE}/AppUpdateTeacherAttendance`,
            GET: `${API_ROOT.TEACHER_ATTENDANCE}/GetTeacherAttendanceList`,
            DELETE: `${API_ROOT.TEACHER_ATTENDANCE}/DeleteTeacherAttendance`,
            GET_LIST_FOR_ATTENDANCE: `${API_ROOT.TEACHER_ATTENDANCE}/GetTeacherListForAttendance`,
            MONTHLY_REPORT: `${API_ROOT.TEACHER_ATTENDANCE}/MonthlyTeacherAttendanceReport`,
            DETAILS: `${API_ROOT.TEACHER_ATTENDANCE}/GetAttendanceDetails`,
            EXPORT: `${API_ROOT.TEACHER_ATTENDANCE}/ExportTeacherAttendance`
        }
    },
    SUPER_ADMIN: {
        GLOBAL_DASHBOARD_PERMISSION: {
            GET_BY_ROLE: 'GlobalDashboardPermission/GetGlobalDashboardPermissionByRole',
            SAVE: 'GlobalDashboardPermission/SaveGlobalDashboardPermission'
        },
        BRANCH: {
            LIST: 'Branch/GetBranchList',
            GET: 'Branch/GetBranchById',
            ADDUPDATE: 'Branch/AddUpdateBranch',
            DELETE: 'Branch/DeleteBranch',
            DROPDOWN: 'Branch/GetBranchListDropdown',
        }
    }
}
import { createGenericStore } from '../../../../../core/store/resource.store';

export interface HomeworkReviewListItem {
  homeworkId: string;
  title: string;
  description: string;
  className: string;
  sectionName: string;
  subjectName: string;
  assignedByUserName: string;
  assignedDate: string | Date;
  dueDate: string | Date;
  isActive: boolean;
  totalStudents: number;
  pendingCount: number;
  submittedCount: number;
  reviewedCount: number;
}

export interface HomeworkReviewStudent {
  studentId: string;
  fullName: string;
  rollNumber: number;
  photo: string | null;
  homeworkStudentId: string | null;
  submissionDescription: string | null;
  submissionAttachmentFileName: string | null;
  submissionDate: string | Date | null;
  status: string | null;
  isLateSubmission: boolean;
  marks: number | null;
  remark: string | null;
  reviewedByUserId: string | null;
  reviewedByUserName: string | null;
  reviewedDate: string | Date | null;
}

export interface HomeworkReviewDetail {
  homeworkId: string;
  title: string;
  description: string;
  className: string;
  sectionName: string;
  subjectName: string;
  assignedByUserName: string;
  assignedDate: string | Date;
  dueDate: string | Date;
  attachment: string | null;
  attachmentFileName: string | null;
  attachmentContentType: string | null;
  homeworks: HomeworkReviewStudent[];
}

export interface SaveHomeworkReviewPayload {
  homeworkStudentId: string | null;
  homeworkId: string;
  studentId: string;
  marks: number | null;
  remark: string;
}

export interface ChangeHomeworkStatus {
  homeworkStudentId: string;
  statusId: number;
  remark: string | null;
}

export const HOMEWORK_REVIEW_CONST = {
  LIST_TITLE: 'Homework Reviews',
  REVIEW_TITLE_PREFIX: 'Review:',
  HOMEWORK_TITLE: 'Homework Title',
  SECTION: 'Section',
  STUDENT_NAME: 'Student Name / Roll No.',
  SUBMISSION: 'Submission',
  REMARKS: 'Remarks',
  REVIEWED_BY: 'Reviewed By',
  ACTIONS: 'Actions',
  SUBMITTED_TO_REVIEW: 'Submitted to Review',
  REVIEWED: 'Reviewed',
  SUBMISSION_VIEW_TITLE: 'Submission Details',
  NO_SUBMISSION: 'No submission found.',
  REMARKS_PLACEHOLDER: 'Enter remarks...',
  SAVE_ALL_RECORDS: 'Save All Records',
  CLASS_SECTION: "Class Section"
};

export const homeworkReviewListStore = createGenericStore<HomeworkReviewListItem>();
export const homeworkReviewDetailStore = createGenericStore<HomeworkReviewDetail>();
export const homeworkStatusUpdateStore = createGenericStore<ChangeHomeworkStatus>();

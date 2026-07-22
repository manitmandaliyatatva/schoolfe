import { createGenericStore } from '../../../../../core/store/resource.store';

export interface HomeworkSubmissionViewDetail {
  homeworkStudentId: string | null;
  homeworkId: string | null;
  studentId: string | null;
  submissionDescription: string | null;
  submissionAttachment: string | null;
  submissionAttachmentFileName: string | null;
  submissionAttachmentFilePath: string | null;
  submissionDate: string | Date | null;
  status: string | null;
  isLateSubmission: boolean;
  marks: number | null;
  remark: string | null;
  reviewedByUserId: string | null;
  homeworkTitle?: string;
  studentName?: string;
  reviewedByUserName?: string;
  reviewedDate?: string | Date | null;
  isActive: boolean;
}

export const HOMEWORK_SUBMISSION_VIEW_CONST = {
  STUDENT: 'Student',
  SUBMISSION_DATE: 'Submission Date',
  REMARK: 'Remark',
  REVIEWED_BY: 'Reviewed By',
  REVIEWED_DATE: 'Reviewed Date',
  LATE_SUBMISSION: 'Late submission',
  SUBMITTED_ON_TIME: 'Submitted on time',
  NO_SUBMISSION: 'No submission found.',
};

export const homeworkSubmissionViewStore = createGenericStore<HomeworkSubmissionViewDetail>();

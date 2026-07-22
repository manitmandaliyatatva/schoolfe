import { createGenericStore } from "../../../../../core/store/resource.store";

export interface HomeworkSubmissionDialogData {
  homeworkId: string | null;
  homeworkStudentId?: string | null;
  homeworkTitle?: string;
  studentHomeworkStatus?: number | string;
}

export interface HomeworkStudent {
  homeworkStudentId: string | null;
  homeworkId: string | null;
  studentId: string | null;
  submissionDescription: string;
  submissionAttachment: string | null;
  submissionAttachmentFileName: string | null;
  submissionAttachmentFilePath: string | null;
  submissionDate: string | Date | null;
  status: string;
  isLateSubmission: boolean;
  marks: number | null;
  remark: string | null;
  reviewedByUserId: string | null;
  homeworkTitle?: string;
  studentName?: string;
  reviewedByUserName?: string;
  reviewedDate?: string | Date | null;
  isActive: boolean;
  isDeleted: boolean;
}

export const homeworkStudentStore = createGenericStore<HomeworkStudent>();

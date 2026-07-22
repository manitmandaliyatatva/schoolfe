import { createGenericStore } from '../../../../../core/store/resource.store';

export interface Homework {
  homeworkId: string | null;
  title: string;
  description: string;
  classSectionId: string | null;
  classSectionName?: string;
  subjectId: string | null;
  subjectName?: string;
  assignedByUserId: string | null;
  assignedByUserName?: string;
  assignedDate: string | Date;
  dueDate: string | Date;
  attachment: string | null;
  attachmentFileName: string | null;
  attachmentFilePath: string | null;
  isActive: boolean;
  isDeleted: boolean;
  studentHomeworkStatus?: number;
  homeworkStudentId?: string | null;
  isEditable?: boolean;
}

export const HOMEWORK_CONST = {
  TITLE: 'Title',
  DESCRIPTION: 'Description',
  ASSIGNED_DATE: 'Assigned Date',
  ATTACHMENT: 'Homework Attachment (PDF)',
  ASSIGNED_BY: 'Assigned By',
  ATTACHMENT_NAME: 'Attachment',
  DEFAULT_FILE_NAME: 'homework-attachment.pdf',
  MIME_TYPE_PDF: 'application/pdf',
  REVIEWED: 'Reviewed',
  PENDING: 'Pending',
  TOTAL_TASKS: 'Total Tasks',
  VIEW_ATTACHMENT: 'View Attachment',
  DUE: 'Due',
  MESSAGES: {
    PREVIEW_ERROR: 'Unable to preview attachment.',
    EMPTY_ERROR: 'Attachment content is empty.',
    OPENED_SUCCESS: (fileName: string) => `Opened ${fileName}`,
    SUBMISSION_SUCCESS: 'Homework submitted successfully.',
  },
  SUBMISSION: {
    DIALOG_TITLE: 'Submit Assignment',
    DESCRIPTION: 'Submission Description',
    ATTACHMENT: 'Assignment Attachment (PDF)',
    SAVE_BUTTON: 'Submit',
    EDIT_BUTTON: 'Edit Submission',
    VIEW_BUTTON: 'View Submission',
    TEACHER_REMARK: "Teacher's Remark: ",
  },
};
export enum HomeWorkStatus {
  pending = 1,
  submitted = 2,
  reviewed = 3,
  rejected = 4,
  needsCorrection = 5
}

export const homeworkStore = createGenericStore<Homework>();
export const homeworkDetailStore = createGenericStore<Homework>();

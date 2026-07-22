import { createGenericStore } from '../../../../../core/store/resource.store';

export interface ExamMarksProgress {
  subjectName: string;
  totalStudents: number;
  marksEntered: number;
}

export interface ExamGroupMarks {
  examGroupId: string;
  examGroupName: string;
  examGroupStartDate: string;
  examGroupEndDate: string;
  classId: string;
  className: string;
  classSectionNames?: string;
  examTypeId: string;
  examTypeName: string;
  isActive: boolean;
  isPublished: boolean;
  isExamPublished: boolean;
  isMarksCompleted: boolean;
  isEditable: boolean;
  marksProgress: ExamMarksProgress[];
}

export const examGroupMarksStore = createGenericStore<ExamGroupMarks>();

export interface ExamMarkDto {
  examId: string;
  examName: string;
  maxMarks: number;
  passingMarks: number;
  subjectId: string;
  subjectName: string;
  examStudentId?: string;
  obtainedMarks?: number | null;
  percentage?: number | null;
  grade?: string | null;
  remarks?: string | null;
  isAbsent: boolean;
  lastEvaluatedBy?: string;
  lastEvaluatedName?: string;
  lastEvaluatedDate?: string;
  isMarksPublished?: boolean;
}

export interface StudentExamGroupMarkDto {
  studentId: string;
  fullName: string;
  rollNumber: number;
  photo: string;
  exams: ExamMarkDto[];
}

export interface ExamGroupMarkDetailsDto {
  examGroupId: string;
  examGroupName: string;
  classSectionId: string;
  classSectionName: string;
  students: StudentExamGroupMarkDto[];
  isPublishBtnVisible: boolean;
  isPublishBtnEnable: boolean;
}

export const examGroupMarkDetailsStore = createGenericStore<ExamGroupMarkDetailsDto>();

export interface StudentMark {
  studentId: string;
  fullName: string;
  rollNumber: number;
  examStudentId: string | null;
  obtainedMarks: number | null;
  percentage: number | null;
  grade: string | null;
  remarks: string | null;
  photo: string | null;
  isAbsent: boolean;
  lastEvaluatedName: string | null;
  lastEvaluatedDate: string | null;
  result?: string;
}

export interface MarksEntryDetail {
  examId: string;
  examName: string;
  maxMarks: number;
  passingMarks: number;
  className: string;
  sectionName: string;
  subjectName: string;
  examDate: string;
  marks: StudentMark[];
}

export interface SaveMarksPayload {
  examStudentId: string | null;
  examId: string;
  studentId: string;
  fullName: string;
  isAbsent: boolean;
  maxMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  remarks: string;
  isMarksPublished?: boolean;
}

export interface SaveMarksBulkRequestDto {
  marksList: SaveMarksPayload[];
  isMarksPublished: boolean;
}

export const MARKS_ENTRY_CONST = {
  EXAM_NAME: 'Exam Name',
  STUDENT_NAME: 'Student Name / Roll No.',
  OBTAINED_MARKS: 'Obtained Marks',
  MARKS: 'Marks',
  PERCENTAGE: 'Percentage',
  GRADE: 'Grade',
  REMARKS: 'Remarks',
  ABSENT: 'Absent',
  ABSENT_LABEL: 'Is Absent?',
  PRESENT: 'Is Present?',
  ACTIONS: 'Actions',
  CLASS_SECTION: 'Class & Section',
  SUBJECT: 'Subject',
  EXAM_DATE: 'Exam Date',
  MAX_MARKS: 'Maximum Marks',
  PASSING_MARKS: 'Passing Marks',
  ROLL_NO: 'Roll No',
  ENTER_MARKS: 'Enter Marks',
  RESULT: 'Result',
  EXAM_RESULTS: 'Exam Results',
  SAVE_ALL_RECORDS: 'Save All Records',
  REMARKS_PLACEHOLDER: 'Enter remarks...',
  LAST_EVALUATED: 'Last Evaluated By / Date',
  PASS: 'Pass',
  FAIL: 'Fail',
  EXAM_GROUP: 'Exam Group',
  NO_STUDENTS_FOUND: 'No student marks found for the selected section.',
  EVALUATED_BY: 'Evaluated By',
  SAVE_AND_PUBLISH: 'Save & Publish',
  PUBLISH_TITLE: 'Publish Exam Marks',
  PUBLISH_CONFIRM_MSG: "Once you publish this you can't unchange it. Are you sure you want to proceed?",
  PUBLISHED: 'Published',
  PUBLISH: 'Publish',
};

export const marksEntryStore = createGenericStore<MarksEntryDetail>();

export const publishExamMarksStore = createGenericStore<Record<string, never>>();

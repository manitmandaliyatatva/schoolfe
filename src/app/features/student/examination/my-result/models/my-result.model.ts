import { createGenericStore } from '../../../../../core/store/resource.store';

export interface StudentExamKPIDto {
  totalExams: number;
  passedExams: number;
  absentExams: number;
  failedExams: number;
  maxGrade: string;
  averageScore: number;
}



export interface MyResult {
  examStudentId: string;
  examId: number;
  examName: string;
  examGroupId: string;
  examGroupName: string;
  studentId: number;
  fullName: string;
  isAbsent: boolean;
  maxMarks: number;
  obtainedMarks: number;
  passingMarks: number;
  percentage: number;
  grade: string;
  remarks: string | null;
  evaluatedBy: number;
  evaluatedByName: string;
  evaluatedDate: string;
  examDate: string;
  startTime: string;
  endTime: string;
  classSectionName: string;
  subjectName: string;
  isActive: boolean;
}

export const MY_RESULT_CONST = {
  EXAM_NAME: 'Exam Name',
  EXAM_DATE_LABEL: 'Exam Date',
  EVALUATED_DATE_LABEL: 'Evaluated Date',
  SUBJECT: 'Subject',
  EXAM_DATE: 'Exam Date',
  MARKS: 'Marks',
  PERCENTAGE: 'Percentage',
  GRADE: 'Grade',
  IS_PRESENT: 'Is Present',
  REMARKS: 'Remarks',
  LAST_EVALUATED: 'Last Evaluated By / Date',
  RESULT: 'Result',
  DOWNLOAD_RESULT: 'Download Result',
  ABSENT: 'Absent',
  PASS: 'Pass',
  FAIL: 'Fail',
};

export const myResultStore = createGenericStore<MyResult>();

export interface GroupedResult {
  examGroupId: string;
  examGroupName: string;
  startDate: string;
  endDate: string;
  isExpanded: boolean;
  results: MyResult[];
  totalExams: number;
  passedExams: number;
  averageScore: number;
  maxGrade: string;
  isDownloadCertificate: boolean;
  certificateExamStudentId: string;
  kpiData?: StudentExamKPIDto;
}

import { createGenericStore } from "../../../../core/store/resource.store";
import { StudentDashboardAttendance } from "../../../admin/dashboard/models/dashboard.model";

export interface StudentDashboardTimetable {
  timetableId: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
  roomNo: number;
  isBreak: boolean;
}

export interface StudentDashboardHomework {
  homeworkId: string;
  title: string;
  description: string;
  subjectName: string;
  dueDate: string;
  submitted: boolean;
  reviewed: boolean;
  remark?: string;
}

export interface StudentDashboardExam {
  examId: string;
  examName: string;
  subjectName: string;
  examDate: Date;
  obtainedMarks?: number;
  maxMarks: number;
  grade: string;
  result: string;
  status: string;
}

export const StudentAttendanceStore = createGenericStore<StudentDashboardAttendance>();
export const StudentTimetableStore = createGenericStore<StudentDashboardTimetable>();
export const StudentExamStore = createGenericStore<StudentDashboardExam>();
export const StudentHomeworkStore = createGenericStore<StudentDashboardHomework>();

export interface StudentDashboardSummaryResponseDto {
    attendanceSummary: StudentDashboardAttendance;
    upcomingExams: { data: any[], recordsTotal: number, recordsFiltered: number };
    birthdaySummary: any[];
    notices: { data: any[], recordsTotal: number, recordsFiltered: number };
    events: { data: any[], recordsTotal: number, recordsFiltered: number };
    holidays: { data: any[], recordsTotal: number, recordsFiltered: number };
    attendanceStatusList: { data: any[], recordsTotal: number, recordsFiltered: number };
    recentHomeworkList: { data: any[], recordsTotal: number, recordsFiltered: number };
    timeTableSummary: any[];
}

export const DashboardStudentSummaryStore = createGenericStore<StudentDashboardSummaryResponseDto>();

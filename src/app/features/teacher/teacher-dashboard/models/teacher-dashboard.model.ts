import { createGenericStore } from "../../../../core/store/resource.store";
import { StudentDashboardAttendance, TeacherDashboardAttendance } from "../../../admin/dashboard/models/dashboard.model";

export interface TodayTimetable {
  startTime: string;
  endTime: string;
  subjectName: string;
  classSectionName: string;
  roomNo: number;
}

export interface DashboardHomework {
  homeworkId: string;
  title: string;
  classSectionName: string;
  subjectName: string;
  totalSubmitted: number;
  totalStudent: number;
  totalReviewed: number;
}

export interface DashboardExam {
  examId: string;
  examName: string;
  classSectionName: string;
  subjectName: string;
  totalStudents: number;
  totalMarkEntry: number;
}

export const TeacherAttendanceStore = createGenericStore<TeacherDashboardAttendance>();
export const StudentAttendanceStore = createGenericStore<StudentDashboardAttendance>();
export const TodayTimetableStore = createGenericStore<TodayTimetable>();
export const TeacherExamStore = createGenericStore<DashboardExam>();
export const TeacherHomeworkStore = createGenericStore<DashboardHomework>();

export interface TeacherDashboardSummaryResponseDto {
    attendanceSummary: TeacherDashboardAttendance;
    upcomingExams: { data: any[], recordsTotal: number, recordsFiltered: number };
    birthdaySummary: any[];
    notices: { data: any[], recordsTotal: number, recordsFiltered: number };
    events: { data: any[], recordsTotal: number, recordsFiltered: number };
    holidays: { data: any[], recordsTotal: number, recordsFiltered: number };
    attendanceStatusList: { data: any[], recordsTotal: number, recordsFiltered: number };
    recentHomeworkList: { data: any[], recordsTotal: number, recordsFiltered: number };
    timeTableSummary: any[];
}

export const DashboardTeacherSummaryStore = createGenericStore<TeacherDashboardSummaryResponseDto>();
import { createGenericStore } from "../../../../core/store/resource.store";
import { Exam } from "../../../common/examination/exam-groups/models/exam-group.model";

export interface DashboardKPI {
  totalStudents: number;
  totalTeachers: number;
  totalSections: number;
  totalCollectedFees: number;
  totalPendingFees: number;
}

export interface DashboardAttendance {
  totalPresentDay: number;
  totalAbsentDay: number;
  totalHalfDay: number;
  totalLateDay: number;
}

export interface TeacherDashboardAttendance extends DashboardAttendance {
  totalTeachers: number;
}

export interface StudentDashboardAttendance extends DashboardAttendance {
  totalStudents: number;
}

export interface AdminDashboardAttendance {
  studentAttendanceSummary: StudentDashboardAttendance;
  teacherAttendanceSummary: TeacherDashboardAttendance;
}

export const DashboardKPIStore = createGenericStore<DashboardKPI>();
export const DashboardAttendanceStore = createGenericStore<AdminDashboardAttendance>();
export const DashboardExamStore = createGenericStore<Exam>();

export interface AdminDashboardSummaryResponseDto {
    kpiCount: DashboardKPI;
    attendanceSummary: AdminDashboardAttendance;
    upcomingExams: { data: any[], recordsTotal: number, recordsFiltered: number };
    birthdaySummary: any[];
    notices: { data: any[], recordsTotal: number, recordsFiltered: number };
    events: { data: any[], recordsTotal: number, recordsFiltered: number };
    holidays: { data: any[], recordsTotal: number, recordsFiltered: number };
    attendanceStatusList: { data: any[], recordsTotal: number, recordsFiltered: number };
}

export const DashboardAdminSummaryStore = createGenericStore<AdminDashboardSummaryResponseDto>();
import { createGenericStore } from "../../../core/store/resource.store";

export interface StudentAttendance {
    attendanceId: string;
    studentId: string;
    rollNumber: number | null;
    fullName: string;
    classSectionId: string;
    attendanceDate: string; // DateOnly maps to string in TypeScript (ISO format: 'YYYY-MM-DD')
    attendanceStatusId: string;
    remark: string;
}

export interface IStudentAttendanceForm {
    classSectionId: string,
    attendanceDate: any,
    students : StudentAttendance[]
}

export interface MonthlyAttendance {
  year: number
  month: number
  monthName: string
  studentAttendances: StudentAttendance[]
}

export interface StudentAttendance {
  studentId: string
  studentName: string
  rollNumber: number
  dailyAttendances: DailyAttendance[]
}

export interface DailyAttendance {
  day: number
  statusName?: string
  statusCode?: string
  remark?: string
}

export const takeAttendenceStore = createGenericStore<StudentAttendance>();
export const monthlyAttendanceStore = createGenericStore<MonthlyAttendance>();
export const saveAttendenceStore = createGenericStore<IStudentAttendanceForm>();
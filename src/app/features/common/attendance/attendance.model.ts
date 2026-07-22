import { createGenericStore } from "../../../core/store/resource.store";

export interface TeacherAttendanceDto {
    teacherId: string;
    fullName: string;
    attendanceStatusId: string;
    remark: string;
    attendanceId: string;
    teacherCode: string;
    attendanceDate: string;
}

export interface ITeacherAttendanceForm {
    attendanceDate: string;
    teachers: TeacherAttendanceDto[];
}

export const takeTeacherAttendanceStore = createGenericStore<TeacherAttendanceDto>();
export const saveTeacherAttendanceStore = createGenericStore<ITeacherAttendanceForm>();
export const reportAttandenceStore = createGenericStore<IStudentAttendanceReport | ITeacherAttendanceReport>();

export interface IStudentAttendanceReport extends IAttendenceReport {
    studentId: string;
    studentName: string;
}

export interface ITeacherAttendanceReport extends IAttendenceReport {
    teacherId: string;
    teacherName: string;
}
export interface IAttendenceReport {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    halfDays: number;
    pendingDays: number;
    percentage: number;
}


export const ATTENDANCE_CONST = {
    TEACHER_NAME: 'Teacher Name',
    STUDENT_NAME: 'Student Name',
    REMARK: 'Remark',
    STATUS: 'Status',
    SELECT_STATUS: "Select Attandence Status!",
    CLASS_SECTION: 'Class Section',
    ROLL_NUMBER: 'Roll Number',
    SELECT_MONTH: 'Select Month',
    SELECT_YEAR: 'Select Year',
    PRESENT: 'Present Days',
    ABSENT: 'Absent Days',
    HALF_DAYS: 'Half Days',
    PENDING: 'Pending Days',
    PERCENTAGE: "Attendance %",
    SELECT_STUDENT: 'Please select at least one student.',
    SELECT_TEACHER: 'Please select at least one teacher.',
    NO_CHANGES: 'No changes detected to save.',
    TOTAL_DAYS: 'Total Days',
    IMPORT_STUDENT_ATTENDANCE: 'Import Student Attendance',
    IMPORT_TEACHER_ATTENDANCE: 'Import Teacher Attendance'
}
import { createGenericStore } from '../../../../../core/store/resource.store';
import { TimetableGridRow, TimetableRecord } from '../../shared/timetable-shared.model';

export type TeacherTimetable = TimetableRecord;
export type TeacherTimetableGridRow = TimetableGridRow<TeacherTimetable>;

export interface DropdownTeacher {
  teacherId: string;
  fullName: string;
}

export const teacherTimetableStore = createGenericStore<TeacherTimetable>();

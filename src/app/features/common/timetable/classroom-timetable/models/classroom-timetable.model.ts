import { createGenericStore } from '../../../../../core/store/resource.store';
import { TimetableGridRow, TimetableRecord } from '../../shared/timetable-shared.model';

export type ClassroomTimetable = TimetableRecord;
export type ClassroomTimetableGridRow = TimetableGridRow<ClassroomTimetable>;

export interface DropdownClassroomFilter {
  classSectionId: string;
  classSectionName: string;
}

export const classroomTimetableStore = createGenericStore<ClassroomTimetable>();

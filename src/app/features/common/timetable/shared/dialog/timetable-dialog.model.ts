export interface TimetableDialogData {
  timeTableId?: string | null;
  selectedTeacherId?: string | null;
  selectedClassSectionId?: string | null;
  selectedTimeSlotId?: string | null;
  selectedWeekDayId?: number | null;
  source?: 'teacher' | 'classroom';
}

export interface DropdownTeacher {
  teacherId: string;
  fullName: string;
}

export interface DropdownClassroom {
  classSectionId: string;
  classSectionName: string;
}

export interface DropdownSubject {
  subjectId: string;
  subjectName: string;
}

export interface DropdownTimeslot {
  timeSlotId: string;
  slotName?: string;
  name?: string;
  isBreak?: boolean;
}

export const TIMETABLE_DIALOG_CONST = {
  TEACHER: 'Teacher',
  CLASSROOM: 'Classroom',
  SUBJECT: 'Subject',
  TIMESLOT: 'Time Slot',
  WEEKDAY: 'Week Day',
  CANCEL: 'Cancel',
  SAVE: 'Save',
};
export interface TimetableRecord {
  timeTableId: string | null;
  classSectionId: string | null;
  classSectionName?: string;
  roomNo?: number | null;
  academicYearId?: string;
  weekDayId: number;
  timeSlotId: string | null;
  startTime?: string;
  endTime?: string;
  isBreak?: boolean;
  subjectId: string | null;
  subjectName?: string;
  teacherId: string | null;
  teacherName?: string;
  isActive: boolean;
}

export interface TimetableGridRow<TRecord extends TimetableRecord = TimetableRecord> {
  rowId: string;
  monday: TRecord | null;
  tuesday: TRecord | null;
  wednesday: TRecord | null;
  thursday: TRecord | null;
  friday: TRecord | null;
  saturday: TRecord | null;
  sunday: TRecord | null;
  sortMinutes: number;
  colorIndex?: number;
  timeFrame?:string
}

export interface TimetableTimeSlot {
  timeSlotId: string | null;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  slotName?: string;
  name?: string;
  isActive?: boolean;
}

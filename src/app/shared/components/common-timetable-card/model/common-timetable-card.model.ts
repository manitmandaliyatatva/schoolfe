export interface TimetableCardData {
  timeTableId: string | null;
  timeSlotId?: string | null;
  weekDayId?: number;
  displayTitle?: string;
  classSectionName?: string;
  subjectName?: string;
  roomNo?: number | null;
  startTime?: string;
  endTime?: string;
  isBreak?: boolean;
  isHoliday?: boolean;
  isNoSchedule?: boolean;
  subjectId?: string | null;
  teacherName?: string;
}
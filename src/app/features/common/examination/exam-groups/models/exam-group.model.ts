import { createGenericStore } from '../../../../../core/store/resource.store';

export interface ExamGroupSubject {
  examId?: string;
  subjectId: string;
  subjectName?: string;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
}

export interface ExamGroup {
  examGroupId: string;
  examGroupName: string;
  classId: string;
  className?: string;
  classSectionIds?: string[];
  classSectionNames?: string;
  examTypeId: string;
  examTypeName?: string;
  examGroupStartDate: string;
  examGroupEndDate: string;
  isActive: boolean;
  isPublished: boolean;
  isEditable?: boolean;
  holidayDates?: string;
  exams: ExamGroupSubject[];
}

export const EXAM_GROUP_CONST = {
  EXAM_GROUP_ID: 'Exam Group Id',
  EXAM_GROUP_NAME: 'Exam Group Name',
  NO_SUBJECTS: 'No subjects scheduled. Click the plus button above to add subject exams.',
  AT_LEAST_ONE_SUBJECT: 'At least one subject schedule must be added.',
  ADD_ROW_TOOLTIP: 'Add Subject Row',
  REARRANGE_TOOLTIP: 'Rearrange Timeline',
  END_DATE_ERROR: 'End date must be on or after start date.',
  PASSING_MARKS_ERROR: 'Invalid value',
  EXAM_CONFLICT_ERROR: 'Another exam is already scheduled for the same day and time.',
  EXAM_DATE_OUT_OF_RANGE_ERROR: 'Date must be between the exam group start and end date.',
  SELECT_CLASS_WARNING: 'Please select class first.',
  HOLIDAY_DATES: 'Holiday Dates',
  HOLIDAY_CONFLICT_ERROR: 'Exam date cannot be a holiday.',
  ROW_TYPE_EXAM: 'EXAM',
  ROW_TYPE_HOLIDAY: 'HOLIDAY',
  SHOW_HOLIDAYS: 'Show Holidays'
};

export const examGroupStore = createGenericStore<ExamGroup>();

export interface Exam {
  examId: string;
  examName: string;
  examTypeId: string;
  examTypeName: string;
  classSectionId: string;
  classSectionName: string;
  subjectId: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
  isPublished: boolean;
  isActive: boolean;
  allowEdit?: boolean;
  examGroupId?: string;
}

export interface GroupedExam {
  examGroupId: string;
  examGroupName: string;
  startDate: string;
  endDate: string;
  isExpanded: boolean;
  exams: Exam[];
  status: string;
}

export const EXAM_CONST = {
  EXAM_ID: 'Exam ID',
  EXAM_NAME: 'Exam Name',
  EXAM_TYPE: 'Exam Type',
  CLASS_SECTION: 'Class Section',
  DATE: 'Date',
  START_TIME: 'Start Time',
  END_TIME: 'End Time',
  MAX_MARKS: 'Max Marks',
  PASSING_MARKS: 'Passing Marks',
  IS_PUBLISHED: 'Is Published',
  EXAM_DATE: 'Exam Date',
  PUBLISH: 'Published',
  DOWNLOAD_TIMETABLE: 'Download Timetable',
  DOWNLOAD_TIMETABLE_TOOLTIP: 'Download Timetable as PDF',
  STATUS_UPCOMING: 'UPCMG',
  STATUS_ONGOING: 'ONGNG',
  STATUS_COMPLETED: 'CMPLT',
  HOLIDAY: 'Holiday',
  FULL_DAY: 'Full Day',
  EXAM: 'Exam',
  EXAMS: 'Exams'
};

export const examStore = createGenericStore<Exam>();

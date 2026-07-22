import { TemplateRef } from '@angular/core';
import { SYSTEM_CONST } from '../../../../core/constants/system.constant';
import { ToMinutes } from '../../../../core/helpers/datetime.helper';
import { TimetableGridRow, TimetableRecord, TimetableTimeSlot } from './timetable-shared.model';
import { CommonDataGridFieldDataType } from '../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGridColumnConfig } from '../../../../shared/components/common-data-grid/model/common-data-grid.model';

export const TIMETABLE_WEEK_DAY_IDS = [0, 1, 2, 3, 4, 5, 6] as const;

export const getTimetableGridColumns = <T extends TimetableGridRow<any>>(
  excludedWeekdays: number[],
  timeslotTemplate: TemplateRef<any>,
  cardTemplate: TemplateRef<any>
): CommonDataGridColumnConfig<T>[] => {
  const allCols: CommonDataGridColumnConfig<T>[] = [
    {
      field: 'timeFrame',
      title: 'Time',
      fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
      customRenderCell: timeslotTemplate,
    },
    {
      title: SYSTEM_CONST.WEEKDAYS.MONDAY,
      field: 'monday',
      fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
      customRenderCell: cardTemplate,
    },
    {
      title: SYSTEM_CONST.WEEKDAYS.TUESDAY,
      field: 'tuesday',
      fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
      customRenderCell: cardTemplate,
    },
    {
      title: SYSTEM_CONST.WEEKDAYS.WEDNESDAY,
      field: 'wednesday',
      fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
      customRenderCell: cardTemplate,
    },
    {
      title: SYSTEM_CONST.WEEKDAYS.THURSDAY,
      field: 'thursday',
      fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
      customRenderCell: cardTemplate,
    },
    {
      title: SYSTEM_CONST.WEEKDAYS.FRIDAY,
      field: 'friday',
      fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
      customRenderCell: cardTemplate,
    },
    {
      title: SYSTEM_CONST.WEEKDAYS.SATURDAY,
      field: 'saturday',
      fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
      customRenderCell: cardTemplate,
    },
    {
      title: SYSTEM_CONST.WEEKDAYS.SUNDAY,
      field: 'sunday',
      fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
      customRenderCell: cardTemplate,
    },
  ];

  return allCols.filter(col => {
    if (col.field === 'timeFrame') return true;
    if (col.field === 'sunday' && excludedWeekdays.includes(0)) return false;
    if (col.field === 'monday' && excludedWeekdays.includes(1)) return false;
    if (col.field === 'tuesday' && excludedWeekdays.includes(2)) return false;
    if (col.field === 'wednesday' && excludedWeekdays.includes(3)) return false;
    if (col.field === 'thursday' && excludedWeekdays.includes(4)) return false;
    if (col.field === 'friday' && excludedWeekdays.includes(5)) return false;
    if (col.field === 'saturday' && excludedWeekdays.includes(6)) return false;
    return true;
  });
};

export interface TimetableListRequestBody {
  pageIndex: number;
  pageSize: number;
  generalSearch: string;
  defaultSortingColumn: string;
  sortOrder: 'asc' | 'desc';
  columns: Array<{
    name: string;
    filterSearch: { value: string };
  }>;
}

export interface GenerateTimeTableSlotsParams<TRecord extends TimetableRecord = TimetableRecord> {
  timeSlots: TimetableTimeSlot[];
  timetableData: TRecord[];
}

export const createTimetableListRequestBody = (
  filterColumnName: string,
  selectedId?: string | number | null,
): TimetableListRequestBody => {
  const normalizedId = selectedId ?? null;
  return {
    pageIndex: 0,
    pageSize: -1,
    generalSearch: '',
    defaultSortingColumn: '',
    sortOrder: 'asc',
    columns: normalizedId
      ? [
        {
          name: filterColumnName,
          filterSearch: { value: String(normalizedId) },
        },
      ]
      : [],
  };
};

export const buildTimetableGridRows = <TRecord extends TimetableRecord>(
  records: TRecord[],
): TimetableGridRow<TRecord>[] => {
  const filtered = records.filter((item) => item.weekDayId != null && TIMETABLE_WEEK_DAY_IDS.includes(item.weekDayId as (typeof TIMETABLE_WEEK_DAY_IDS)[number]));
  const grouped = new Map<string, TimetableGridRow<TRecord>>();

  filtered.forEach((item) => {
    const key = `${item.timeSlotId}-${item.startTime || ''}-${item.endTime || ''}`;
    const existing = grouped.get(key) ?? {
      rowId: key,
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
      sortMinutes: ToMinutes(item.startTime),
    };

    switch (item.weekDayId) {
      case 0:
        existing.sunday = item;
        break;
      case 1:
        existing.monday = item;
        break;
      case 2:
        existing.tuesday = item;
        break;
      case 3:
        existing.wednesday = item;
        break;
      case 4:
        existing.thursday = item;
        break;
      case 5:
        existing.friday = item;
        break;
      case 6:
        existing.saturday = item;
        break;
    }

    grouped.set(key, existing);
  });

  let nonBreakCounter = 0;
  return Array.from(grouped.values())
    .sort((a, b) => a.sortMinutes - b.sortMinutes)
    .map((item, index) => {
      const isBreakRow = !!item.monday?.isBreak || !!item.tuesday?.isBreak || !!item.wednesday?.isBreak || !!item.thursday?.isBreak || !!item.friday?.isBreak || !!item.saturday?.isBreak || !!item.sunday?.isBreak;
      const colorIndex = isBreakRow ? 0 : nonBreakCounter++;
      return {
        ...item,
        rowId: `${item.rowId}-${index}`,
        colorIndex,
      };
    });
};

export const generateTimeTableSlots = <TRecord extends TimetableRecord>({
  timeSlots,
  timetableData,
}: GenerateTimeTableSlotsParams<TRecord>): TRecord[] => {
  if (!timeSlots?.length) return timetableData ?? [];

  const slots: TRecord[] = [];
  const filteredDays = TIMETABLE_WEEK_DAY_IDS;

  filteredDays.forEach((day) => {
    timeSlots.forEach((timeSlot) => {
      const existingTimeTable = timetableData.find(
        (tt) => tt.weekDayId === day && tt.timeSlotId === timeSlot.timeSlotId
      );

      if (existingTimeTable) {
        slots.push(existingTimeTable);
        return;
      }

      const defaultSlot: TimetableRecord = {
        timeTableId: null,
        classSectionId: null,
        classSectionName: '',
        roomNo: undefined,
        academicYearId: null,
        weekDayId: day,
        timeSlotId: timeSlot.timeSlotId,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        isBreak: !!timeSlot.isBreak,
        subjectId: null,
        subjectName: '',
        teacherId: null,
        teacherName: '',
        isActive: true,
      };
      slots.push(defaultSlot as TRecord);
    });
  });

  return slots.sort((a, b) => {
    if (a.weekDayId !== b.weekDayId) return a.weekDayId - b.weekDayId;
    return ToMinutes(a.startTime) - ToMinutes(b.startTime);
  });
};

export const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  0: 'Sun'
};

export const WEEKDAY_TABS = [
  { key: 'monday', label: WEEKDAY_LABELS[1] },
  { key: 'tuesday', label: WEEKDAY_LABELS[2] },
  { key: 'wednesday', label: WEEKDAY_LABELS[3] },
  { key: 'thursday', label: WEEKDAY_LABELS[4] },
  { key: 'friday', label: WEEKDAY_LABELS[5] },
  { key: 'saturday', label: WEEKDAY_LABELS[6] },
  { key: 'sunday', label: WEEKDAY_LABELS[0] }
] as const;

export const SUBJECT_THEMES = [
  { borderLeftColor: '#f97316', textColor: '#ea580c', bgColor: '#fff7ed', iconBgColor: '#ffedd5', icon: 'menu_book' },
  { borderLeftColor: '#2563eb', textColor: '#1d4ed8', bgColor: '#eff6ff', iconBgColor: '#dbeafe', icon: 'school' },
  { borderLeftColor: '#0d9488', textColor: '#0f766e', bgColor: '#f0fdfa', iconBgColor: '#ccfbf1', icon: 'science' },
  { borderLeftColor: '#ec4899', textColor: '#be185d', bgColor: '#fdf2f8', iconBgColor: '#fce7f3', icon: 'palette' },
  { borderLeftColor: '#eab308', textColor: '#a16207', bgColor: '#fefce8', iconBgColor: '#fef9c3', icon: 'calculate' },
  { borderLeftColor: '#8b5cf6', textColor: '#6d28d9', bgColor: '#f5f3ff', iconBgColor: '#ede9fe', icon: 'computer' },
  { borderLeftColor: '#10b981', textColor: '#047857', bgColor: '#ecfdf5', iconBgColor: '#d1fae5', icon: 'sports_soccer' },
  { borderLeftColor: '#f43f5e', textColor: '#be123c', bgColor: '#fff1f2', iconBgColor: '#ffe4e6', icon: 'music_note' },
];

export function getSubjectHash(subjectId: string | null | undefined, subjectName: string | null | undefined): number {
  const key = subjectId || subjectName || '';
  if (!key) return 0;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getSubjectIcon(subjectId: string | null | undefined, subjectName: string | undefined, isBreak: boolean): string {
  if (isBreak) {
    return 'local_cafe';
  }
  if (!subjectId && !subjectName) {
    return 'event_busy';
  }
  const hash = getSubjectHash(subjectId, subjectName);
  return SUBJECT_THEMES[hash % SUBJECT_THEMES.length].icon;
}

export function getThemeColor(subjectId: string | null | undefined, subjectName: string | undefined, isBreak: boolean): {
  borderLeftColor: string;
  textColor: string;
  bgColor: string;
  iconBgColor: string;
} {
  if (isBreak) {
    return {
      borderLeftColor: '#8b5cf6',
      textColor: '#6d28d9',
      bgColor: '#f5f3ff',
      iconBgColor: '#ede9fe'
    };
  }
  if (!subjectId && !subjectName) {
    return {
      borderLeftColor: '#cbd5e1',
      textColor: '#64748b',
      bgColor: '#f8fafc',
      iconBgColor: '#f1f5f9'
    };
  }
  const hash = getSubjectHash(subjectId, subjectName);
  const theme = SUBJECT_THEMES[hash % SUBJECT_THEMES.length];
  return {
    borderLeftColor: theme.borderLeftColor,
    textColor: theme.textColor,
    bgColor: theme.bgColor,
    iconBgColor: theme.iconBgColor
  };
}

export const getActiveDayClasses = <TRecord extends TimetableRecord>(
  timetableData: TRecord[],
  timeSlots: TimetableTimeSlot[],
  day: number
): TRecord[] => {
  const fieldMap: Record<number, 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    0: 'sunday'
  };
  const field = fieldMap[day];
  if (!field) return [];

  const generatedSlots = generateTimeTableSlots<TRecord>({
    timeSlots,
    timetableData,
  });
  const rows = buildTimetableGridRows<TRecord>(generatedSlots);
  const dayClasses: TRecord[] = [];

  rows.forEach((row) => {
    const value = row[field];
    if (value && typeof value === 'object' && 'timeTableId' in value) {
      dayClasses.push(value);
    }
  });

  return dayClasses;
};
